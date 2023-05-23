import { bytes } from '@ckb-lumos/codec'
import { BI } from '@ckb-lumos/bi'
import type { Script } from '@ckb-lumos/base'
import { get, cloneDeep } from 'lodash'
import type { ActorMessage, ActorRef, MessagePayload } from '../actor'
import type {
  OutPointString,
  StoreMessage,
  StorePath,
  StorageSchema,
  StorageLocation,
  GetStorageStruct,
  GetFullStorageStruct,
  OmitByValue,
  GetStorageOption,
  UpdateStorageValue,
  GetOnChainStorage,
  ByteLength,
} from './interface'
import type { JSONStorageOffChain } from './json-storage'
import type { GetState } from './chain-storage'
import { ChainStorage } from './chain-storage'
import { Actor } from '../actor'
import { JSONStorage } from './json-storage'
import {
  NoCellToUseException,
  NonExistentCellException,
  NonExistentException,
  NonStorageInstanceException,
  NoSchemaException,
  SectionStoreCannotCloneException,
  UnmatchLengthException,
} from '../exceptions'
import { ProviderKey, CellPattern, SchemaPattern, isStringList } from '../utils'
import { outPointToOutPointString } from '../resource-binding'
import { MoleculeStorage, DynamicParam, GetCodecConfig, isCodecConfig, GetMoleculeOffChain } from './molecule-storage'
import { computeScriptHash } from '@ckb-lumos/base/lib/utils'
import { DefaultMergeStrategy, MergeStrategy } from './merge-strategy'

const ByteCharLen = 2

function getUint8ArrayfromHex(value: string, offset: ByteLength, length: ByteLength) {
  return bytes.bytify(
    `0x${value.slice(2 + offset * ByteCharLen, length ? 2 + offset * ByteCharLen + length * ByteCharLen : undefined)}`,
  )
}

export class Store<
  StorageT extends ChainStorage,
  StructSchema extends StorageSchema<GetState<StorageT>>,
  Option = never,
> extends Actor<GetStorageStruct<StructSchema>, MessagePayload<StoreMessage>> {
  protected states: Record<OutPointString, GetStorageStruct<StructSchema>> = {}

  protected chainData: Record<OutPointString, UpdateStorageValue> = {}

  protected outPointStrings: OutPointString[] = []

  protected usedOutPointStrings = new Set<OutPointString>()

  protected options?: Option

  protected schemaOption: GetStorageOption<StructSchema>

  protected cellPatterns: CellPattern[] = []

  protected schemaPattern?: SchemaPattern

  protected mergedState?: GetStorageStruct<StructSchema>

  protected mergedStatesFieldOutPoint: Record<string, OutPointString> = {}

  protected isSection = false

  protected mergeStrategy: MergeStrategy<GetStorageStruct<StructSchema>> = new DefaultMergeStrategy<
    GetStorageStruct<StructSchema>
  >()

  #lock?: Script

  #type?: Script

  get lockScript() {
    return this.#lock
  }

  get typeScript() {
    return this.#type
  }

  constructor(
    schemaOption: GetStorageOption<StructSchema>,
    params?: {
      cellPatterns?: CellPattern[]
      schemaPattern?: SchemaPattern
      options?: Option
      ref?: ActorRef
    },
  ) {
    super(params?.ref)
    this.schemaPattern = Reflect.getMetadata(ProviderKey.SchemaPattern, this.constructor) || params?.schemaPattern
    this.schemaOption = schemaOption
    this.options = params?.options

    this.initiateLock(params?.ref)
    this.#type = Reflect.getMetadata(ProviderKey.TypePattern, this.constructor)

    const cellPatternFactorys = Reflect.getMetadata(ProviderKey.CellPattern, this.constructor)
    this.cellPatterns =
      params?.cellPatterns ??
      (cellPatternFactorys
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          cellPatternFactorys.map((factory: (...args: any[]) => CellPattern) =>
            factory({ lockScript: this.lockScript }),
          )
        : [])
  }

  private initiateLock(ref?: ActorRef) {
    const createLock = Reflect.getMetadata(ProviderKey.LockPattern, this.constructor)
    if (typeof createLock == 'function') this.#lock = createLock(ref)
  }

  protected registerResourceBinding() {
    if (!this.#lock) return

    const lockHash = computeScriptHash(this.#lock)
    this.call('local://resource', {
      pattern: lockHash,
      value: {
        type: 'register',
        register: {
          lockScript: this.#lock,
          typeScript: this.#type,
          uri: this.ref.uri,
          pattern: lockHash,
        },
      },
    })
  }

  public load(path?: string) {
    if (this.mergedState === undefined) return undefined
    if (path) {
      return get(this.mergedState, path, null)
    }

    return this.mergedState
  }

  private getOffsetAndLength(option: unknown): [ByteLength, ByteLength] {
    if (typeof option !== 'object' || option === null) return [0, 0]
    const offset = 'offset' in option && typeof option.offset === 'number' ? option.offset : 0
    const length = 'length' in option && typeof option.length === 'number' ? option.length : 0
    return [offset, length]
  }

  private deserializeField(type: StorageLocation, option: unknown, value: string) {
    this.assertStorage(this.getStorage(type))
    try {
      const [offset, length] = this.getOffsetAndLength(option)
      return this.getStorage(type)?.deserialize(getUint8ArrayfromHex(value, offset, length))
    } catch (error) {
      return undefined
    }
  }

  private deserializeCell({ cell, witness }: UpdateStorageValue): GetStorageStruct<StructSchema> {
    if (!this.schemaOption || typeof this.schemaOption !== 'object') return {} as GetStorageStruct<StructSchema>
    const res: Partial<Record<StorageLocation, unknown>> = {}
    if ('data' in this.schemaOption) {
      res.data = this.deserializeField('data', this.schemaOption.data, cell.data)
    }
    if ('witness' in this.schemaOption) {
      res.witness = this.deserializeField('witness', this.schemaOption.witness, witness)
    }
    if ('lockArgs' in this.schemaOption) {
      res.lockArgs = this.deserializeField('lockArgs', this.schemaOption.lockArgs, cell.cellOutput.lock.args)
    }
    if ('typeArgs' in this.schemaOption && cell.cellOutput.type) {
      res.typeArgs = this.deserializeField('typeArgs', this.schemaOption.typeArgs, cell.cellOutput.type.args)
    }
    return res as GetStorageStruct<StructSchema>
  }

  private addState({ cell, witness }: UpdateStorageValue) {
    if (!this.cellPatterns.every((pattern) => pattern({ cell, witness }))) {
      // ignore cells from resource binding if pattern is not matched
      return
    }
    if (cell.outPoint) {
      const outPoint = outPointToOutPointString(cell.outPoint)
      const value = this.deserializeCell({ cell, witness })
      if (this.schemaPattern && !this.schemaPattern(value)) {
        return
      }
      this.states[outPoint] = value
      this.chainData[outPoint] = { cell, witness }
      this.mergedState = this.mergeStrategy.merge(value, this.mergedState)
      this.outPointStrings.push(outPoint)
    }
  }

  private removeState(keys: OutPointString[]) {
    keys.forEach((key) => {
      delete this.states[key]
      delete this.chainData[key]
    })
    this.outPointStrings = this.outPointStrings.filter((outPoint) => !keys.includes(outPoint))
    this.mergedState = this.outPointStrings.reduce(
      (pre: undefined | GetStorageStruct<StructSchema>, outPoint) =>
        this.mergeStrategy.merge(this.states[outPoint], pre),
      undefined,
    )
  }

  private updateChainData(key: OutPointString, paths?: StorePath) {
    if (!paths) {
      const value = this.get(key)
      if ('data' in value) {
        this.updateValueInCell('data', key, value.data)
      }
      if ('witness' in value) {
        this.updateValueInCell('witness', key, value.witness)
      }
      if ('lockArgs' in value) {
        this.updateValueInCell('lockArgs', key, value.lockArgs)
      }
      if ('typeArgs' in value) {
        this.updateValueInCell('typeArgs', key, value.typeArgs)
      }
    } else {
      this.updateValueInCell(paths[0], key, this.get(key, [paths[0]]))
    }
  }

  private updateValueInCell(type: StorageLocation, key: OutPointString, newValue: unknown) {
    const cellInfo = this.chainData[key]
    if (!cellInfo) throw new NonExistentCellException(key)
    const { offset, length, hexString } = this.serializeField(type, newValue)
    let originalValue: string | undefined
    switch (type) {
      case 'data':
        cellInfo.cell.data =
          cellInfo.cell.data.slice(0, 2 + offset * ByteCharLen) +
          hexString.slice(2) +
          (length ? cellInfo.cell.data.slice(2 + offset * ByteCharLen + length * ByteCharLen) : '')
        return
      case 'witness':
        cellInfo.witness =
          cellInfo.witness.slice(0, 2 + offset * ByteCharLen) +
          hexString.slice(2) +
          (length ? cellInfo.witness.slice(2 + offset * ByteCharLen + length * ByteCharLen) : '')
        return
      case 'lockArgs':
        originalValue = cellInfo.cell.cellOutput.lock.args
        cellInfo.cell.cellOutput.lock.args =
          originalValue.slice(0, 2 + offset * ByteCharLen) +
          hexString.slice(2) +
          (length ? originalValue.slice(2 + offset * ByteCharLen + length * ByteCharLen) : '')
        return
      case 'typeArgs':
        if (cellInfo.cell.cellOutput.type) {
          originalValue = cellInfo.cell.cellOutput.type.args
          cellInfo.cell.cellOutput.type.args =
            originalValue.slice(0, 2 + offset * ByteCharLen) +
            hexString.slice(2) +
            (length ? originalValue.slice(2 + offset * ByteCharLen + length * ByteCharLen) : '')
        }
        return
      default:
        break
    }
  }

  private serializeField(type: StorageLocation, offChainValue: unknown) {
    if (!this.schemaOption || typeof this.schemaOption !== 'object') return { hexString: '0x', offset: 0, length: 0 }
    this.assertStorage(this.getStorage(type))
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const hexString = bytes.hexify(this.getStorage(type)!.serialize(offChainValue))
    if (typeof type === 'string') {
      if (!(type in this.schemaOption)) throw new NoSchemaException(type)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [offset, length] = this.getOffsetAndLength((this.schemaOption as any)[type])
      if (length && hexString.length !== length) throw new UnmatchLengthException(type, length, hexString.length)
      return { hexString, offset, length }
    } else {
      if (!(type[0] in this.schemaOption)) throw new NoSchemaException(type[0])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!(type[1] in (this.schemaOption as any)[type[0]])) throw new NoSchemaException(`${type[0]}.${type[1]}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [offset, length] = this.getOffsetAndLength((this.schemaOption as any)[type[0]][type[1]])
      if (length && hexString.length !== length)
        throw new UnmatchLengthException(`${type[0]}.${type[1]}`, length, hexString.length)
      return { hexString, offset, length }
    }
  }

  private cloneChainData(): Record<OutPointString, UpdateStorageValue> {
    const clone: Record<OutPointString, UpdateStorageValue> = {}
    Object.keys(this.chainData).forEach((outPoint: string) => {
      const value = this.chainData[outPoint]
      clone[outPoint] = {
        cell: {
          ...value.cell,
          cellOutput: {
            capacity: value.cell.cellOutput.capacity,
            lock: { ...value.cell.cellOutput.lock },
            type: value.cell.cellOutput.type ? { ...value.cell.cellOutput.type } : undefined,
          },
          outPoint: value.cell.outPoint ? { ...value.cell.outPoint } : undefined,
        },
        witness: value.witness,
      }
    })
    return clone
  }

  private cloneStates() {
    const states: Record<OutPointString, GetFullStorageStruct<StructSchema>> = {}
    Object.keys(this.states).forEach((key) => {
      const currentStateInKey = this.states[key]
      states[key] = (states[key] || {}) as GetFullStorageStruct<StructSchema>
      if ('data' in currentStateInKey && currentStateInKey.data !== undefined) {
        this.assertStorage(this.getStorage('data'))
        states[key].data = this.getStorage('data')?.clone(currentStateInKey.data)
      }
      if ('witness' in currentStateInKey && currentStateInKey.witness !== undefined) {
        this.assertStorage(this.getStorage('witness'))
        states[key].witness = this.getStorage('witness')?.clone(currentStateInKey.witness)
      }
      if ('lockArgs' in currentStateInKey && (currentStateInKey.lockArgs ?? false) !== false) {
        this.assertStorage(this.getStorage('lockArgs'))
        states[key].lockArgs = this.getStorage('lockArgs')?.clone(currentStateInKey.lockArgs)
      }
      if ('typeArgs' in currentStateInKey && (currentStateInKey.typeArgs ?? false) !== false) {
        this.assertStorage(this.getStorage('typeArgs'))
        states[key].typeArgs = this.getStorage('typeArgs')?.clone(currentStateInKey.typeArgs)
      }
    })
    return states as unknown as Record<OutPointString, GetStorageStruct<StructSchema>>
  }

  private updateMergedData(value: unknown, paths?: StorePath) {
    if (!this.outPointStrings.length) throw new NoCellToUseException()
    const { update, remove } = this.mergeStrategy.findAndUpdate({
      paths: paths,
      value,
      outPointStrings: this.outPointStrings,
      states: this.states,
      isValueEqual: this.isValueEqual,
      isSimpleType: this.isSimpleType,
    })
    const changedOutPoints = new Set([...(remove ?? []), ...(update ?? []).map((v) => v.outPointString)])
    this.outPointStrings = this.outPointStrings.filter((outPoint) => !changedOutPoints.has(outPoint))
    let removeCapacity = BI.from(0)
    remove?.forEach((v) => {
      this.usedOutPointStrings.add(v)
      delete this.states[v]
      removeCapacity = removeCapacity.add(this.chainData[v].cell.cellOutput.capacity)
      delete this.chainData[v]
    })
    update?.forEach((v, idx) => {
      this.usedOutPointStrings.add(v.outPointString)
      this.outPointStrings.push(v.outPointString)
      this.states[v.outPointString] = v.state
      if (idx === 0) {
        this.chainData[v.outPointString].cell.cellOutput.capacity = removeCapacity
          .add(this.chainData[v.outPointString].cell.cellOutput.capacity)
          .toHexString()
      }
      this.updateChainData(v.outPointString)
    })
    this.mergedState = this.outPointStrings.reduce(
      (pre: undefined | GetStorageStruct<StructSchema>, outPoint) =>
        this.mergeStrategy.merge(this.states[outPoint], pre),
      undefined,
    )
  }

  initOnChain(value: GetStorageStruct<StructSchema>): GetOnChainStorage<StructSchema> {
    const res: StorageSchema<string> = {}
    if ('data' in value) {
      const { offset, hexString } = this.serializeField('data', value.data)
      res.data = `0x${offset ? '0'.repeat(offset * ByteCharLen) : ''}${hexString.slice(2)}`
    }
    if ('witness' in value) {
      const { offset, hexString } = this.serializeField('witness', value.witness)
      res.witness = `0x${offset ? '0'.repeat(offset * ByteCharLen) : ''}${hexString.slice(2)}`
    }
    if ('lockArgs' in value) {
      const { offset, hexString } = this.serializeField('lockArgs', value.lockArgs)
      res.lockArgs = `0x${offset ? '0'.repeat(offset * ByteCharLen) : ''}${hexString.slice(2)}`
    }
    if ('typeArgs' in value) {
      const { offset, hexString } = this.serializeField('typeArgs', value.typeArgs)
      res.typeArgs = `0x${offset ? '0'.repeat(offset * ByteCharLen) : ''}${hexString.slice(2)}`
    }
    return res as GetOnChainStorage<StructSchema>
  }

  handleCall = (msg: ActorMessage<MessagePayload<StoreMessage>>): void => {
    if (this.isSection) return
    switch (msg.payload?.pattern) {
      case 'update_cells':
        msg.payload.value?.forEach((cellInfo) => {
          if (typeof cellInfo !== 'string') {
            this.addState(cellInfo)
          }
        })
        break
      case 'remove_cells':
        if (isStringList(msg.payload.value)) {
          this.removeState(msg.payload.value)
        }
        break
      default:
      // ignore
    }
  }

  getStorage(_storeKey: StorageLocation): StorageT | undefined {
    return undefined
  }

  assertStorage(storage: StorageT | undefined) {
    if (!storage) throw new NonStorageInstanceException()
  }

  clone(): Store<StorageT, StructSchema, Option> {
    if (this.isSection) throw new SectionStoreCannotCloneException()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clone: Store<StorageT, StructSchema, Option> = new (<any>this.constructor)(this.schemaOption, {
      options: this.options,
      cellPatterns: this.cellPatterns,
      schemaPattern: this.schemaPattern,
    })
    clone.states = this.cloneStates()
    clone.chainData = this.cloneChainData()
    clone.outPointStrings = [...this.outPointStrings]
    clone.mergedState = cloneDeep(this.mergedState)
    clone.usedOutPointStrings = new Set(this.usedOutPointStrings)
    return clone
  }

  cloneSection(): Store<StorageT, StructSchema, Option> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clone: Store<StorageT, StructSchema, Option> = new (<any>this.constructor)(this.schemaOption, {
      options: this.options,
    })
    clone.states = this.cloneStates()
    clone.chainData = this.cloneChainData()
    clone.outPointStrings = [...this.outPointStrings]
    clone.mergedState = cloneDeep(this.mergedState)
    clone.isSection = true
    clone.usedOutPointStrings = new Set([...this.usedOutPointStrings])
    return clone
  }

  get(key: OutPointString): GetFullStorageStruct<StructSchema>
  get(key: OutPointString, paths: ['data']): GetFullStorageStruct<StructSchema>['data']
  get(key: OutPointString, paths: ['witness']): GetFullStorageStruct<StructSchema>['witness']
  get(key: OutPointString, paths: ['lockArgs']): GetFullStorageStruct<StructSchema>['lockArgs']
  get(key: OutPointString, paths: ['typeArgs']): GetFullStorageStruct<StructSchema>['typeArgs']
  get(key: OutPointString, paths: [StorageLocation, ...string[]]): unknown
  get(): GetFullStorageStruct<StructSchema>
  get(paths: ['data']): GetFullStorageStruct<StructSchema>['data']
  get(paths: ['witness']): GetFullStorageStruct<StructSchema>['witness']
  get(paths: ['lockArgs']): GetFullStorageStruct<StructSchema>['lockArgs']
  get(paths: ['typeArgs']): GetFullStorageStruct<StructSchema>['typeArgs']
  get(paths: [StorageLocation, ...string[]]): unknown
  get(keyOrPaths?: OutPointString | StorePath, paths?: StorePath) {
    if (keyOrPaths === undefined) return this.mergedState
    if (Array.isArray(keyOrPaths)) {
      if (keyOrPaths.length === 1) return get(this.mergedState, keyOrPaths)
      const upLevelData = get(this.mergedState, keyOrPaths.slice(0, keyOrPaths.length - 1))
      if (upLevelData === undefined) throw new NonExistentException(keyOrPaths.join('.'))
      return upLevelData(keyOrPaths.at(-1))
    }
    if (!paths?.length) {
      return this.states[keyOrPaths]
    }
    const upLevelData = get(this.states, [keyOrPaths, ...paths.slice(0, paths.length - 1)])
    if (upLevelData === undefined) throw new NonExistentException(`${keyOrPaths}:${paths.join('.')}`)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return upLevelData[paths.at(-1)!]
  }

  set(key: OutPointString, value: GetStorageStruct<StructSchema>): Store<StorageT, StructSchema, Option>
  set(
    key: OutPointString,
    paths: ['data'],
    value: GetFullStorageStruct<StructSchema>['data'],
  ): Store<StorageT, StructSchema, Option>
  set(
    key: OutPointString,
    paths: ['witness'],
    value: GetFullStorageStruct<StructSchema>['witness'],
  ): Store<StorageT, StructSchema, Option>
  set(
    key: OutPointString,
    paths: ['lockArgs'],
    value: GetFullStorageStruct<StructSchema>['lockArgs'],
  ): Store<StorageT, StructSchema, Option>
  set(
    key: OutPointString,
    paths: ['typeArgs'],
    value: GetFullStorageStruct<StructSchema>['typeArgs'],
  ): Store<StorageT, StructSchema, Option>
  set<T = unknown>(
    key: OutPointString,
    paths: [StorageLocation, string, ...string[]],
    value: T,
  ): Store<StorageT, StructSchema, Option>
  set(value: GetStorageStruct<StructSchema>): Store<StorageT, StructSchema, Option>
  set(paths: ['data'], value: GetFullStorageStruct<StructSchema>['data']): Store<StorageT, StructSchema, Option>
  set(paths: ['witness'], value: GetFullStorageStruct<StructSchema>['witness']): Store<StorageT, StructSchema, Option>
  set(paths: ['lockArgs'], value: GetFullStorageStruct<StructSchema>['lockArgs']): Store<StorageT, StructSchema, Option>
  set(paths: ['typeArgs'], value: GetFullStorageStruct<StructSchema>['typeArgs']): Store<StorageT, StructSchema, Option>
  set<T = unknown>(paths: [StorageLocation, string, ...string[]], value: T): Store<StorageT, StructSchema, Option>
  set<T = unknown>(
    key: OutPointString | StorePath | GetStorageStruct<StructSchema>,
    paths?: StorePath | GetStorageStruct<StructSchema> | T,
    value?: T,
  ) {
    const sectionStore = this.cloneSection()
    // one parameter
    if (value === undefined && paths === undefined) {
      // update merged data root
      sectionStore.updateMergedData(key as GetStorageStruct<StructSchema>)
      return sectionStore
    }
    // two parameter
    if (value === undefined) {
      if (typeof key === 'string') {
        // update outPoint root
        if (!(key in sectionStore.states)) throw new NonExistentException(key)
        sectionStore.states[key] = paths as GetStorageStruct<StructSchema>
        sectionStore.updateChainData(key as OutPointString)
        return sectionStore
      } else {
        // update merged data not root
        sectionStore.updateMergedData(paths, key as StorePath)
        return sectionStore
      }
    }
    // three parameters
    const valuePath = paths as StorePath
    const updateValue = get(sectionStore.states, [key as OutPointString, ...valuePath.slice(0, valuePath.length - 1)])
    if (updateValue === undefined) throw new NonExistentException(`${key}:${valuePath.join('.')}`)
    const lastKey = valuePath.at(-1)
    if (lastKey !== undefined) {
      updateValue[lastKey] = value
    } else {
      sectionStore.states[key as OutPointString] = value as GetStorageStruct<StructSchema>
    }
    sectionStore.updateChainData(key as OutPointString, valuePath)
    return sectionStore
  }

  getChainData(key: OutPointString) {
    return this.chainData[key]
  }

  getTxFromDiff(fromStore: Store<StorageT, StructSchema, Option>) {
    const inputs = [...this.usedOutPointStrings].map((v) => fromStore.chainData[v]).filter((v) => !!v)
    const outputs = [...this.usedOutPointStrings].map((v) => this.chainData[v]).filter((v) => !!v)
    return {
      inputs: inputs.map((v) => v.cell),
      outputs: outputs.map((v) => v.cell),
      witness: outputs.map((v) => v.witness),
    }
  }

  protected isSimpleType?: (value: unknown) => boolean
  protected isValueEqual?: (_value: unknown, __compare: unknown) => boolean
}

type IsUnknownOrNever<T> = T extends never ? true : unknown extends T ? (0 extends 1 & T ? false : true) : false

export type GetStorageStructByTemplate<T extends StorageSchema> = OmitByValue<{
  data: IsUnknownOrNever<T['data']> extends true ? never : T['data']
  witness: IsUnknownOrNever<T['witness']> extends true ? never : T['witness']
  lockArgs: IsUnknownOrNever<T['lockArgs']> extends true ? never : T['lockArgs']
  typeArgs: IsUnknownOrNever<T['typeArgs']> extends true ? never : T['typeArgs']
}>

export class JSONStore<R extends StorageSchema<JSONStorageOffChain>> extends Store<
  JSONStorage<JSONStorageOffChain>,
  GetStorageStructByTemplate<R>
> {
  getStorage(_storeKey: StorageLocation): JSONStorage<JSONStorageOffChain> {
    return new JSONStorage()
  }
}

type GetFieldConfig<T> = T extends DynamicParam
  ? GetCodecConfig<T>
  : T extends { schema: DynamicParam }
  ? GetCodecConfig<T['schema']>
  : never

type GetMoleculeConfig<T extends StorageSchema<DynamicParam>> = GetStorageStructByTemplate<{
  data: GetFieldConfig<T['data']>
  witness: GetFieldConfig<T['witness']>
  lockArgs: GetFieldConfig<T['lockArgs']>
  typeArgs: GetFieldConfig<T['typeArgs']>
}>

type GetFieldSchema<T> = T extends DynamicParam
  ? GetMoleculeOffChain<T>
  : T extends { schema: DynamicParam }
  ? Omit<T, 'schema'> & { schema: GetMoleculeOffChain<T['schema']> }
  : never

type GetMoleculeStorageStruct<T extends StorageSchema> = GetStorageStructByTemplate<{
  data: GetFieldSchema<T['data']>
  witness: GetFieldSchema<T['witness']>
  lockArgs: GetFieldSchema<T['lockArgs']>
  typeArgs: GetFieldSchema<T['typeArgs']>
}>

export class MoleculeStore<R extends StorageSchema<DynamicParam>> extends Store<
  MoleculeStorage<DynamicParam>,
  GetMoleculeStorageStruct<R>,
  GetMoleculeConfig<R>
> {
  constructor(
    schemaOption: GetStorageOption<GetMoleculeStorageStruct<R>>,
    params: {
      states?: Record<OutPointString, GetStorageStruct<GetMoleculeStorageStruct<R>>>
      chainData?: Record<OutPointString, UpdateStorageValue>
      cellPattern?: CellPattern
      schemaPattern?: SchemaPattern
      options: GetMoleculeConfig<R>
    },
  ) {
    super(schemaOption, params)
  }

  #moleculeStorageCache: Partial<Record<StorageLocation, MoleculeStorage<DynamicParam>>> = {}

  getStorage(storeKey: StorageLocation): MoleculeStorage<DynamicParam> | undefined {
    if (this.#moleculeStorageCache[storeKey]) return this.#moleculeStorageCache[storeKey]
    switch (storeKey) {
      case 'data':
        if (this.options && 'data' in this.options && isCodecConfig(this.options.data)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore for Type instantiation is excessively deep and possibly infinite.
          this.#moleculeStorageCache[storeKey] = new MoleculeStorage(this.options.data)
        }
        break
      case 'lockArgs':
        if (this.options && 'lockArgs' in this.options && isCodecConfig(this.options.lockArgs)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore for Type instantiation is excessively deep and possibly infinite.
          this.#moleculeStorageCache[storeKey] = new MoleculeStorage(this.options.lockArgs)
        }
        break
      case 'typeArgs':
        if (this.options && 'typeArgs' in this.options && isCodecConfig(this.options.typeArgs)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore for Type instantiation is excessively deep and possibly infinite.
          this.#moleculeStorageCache[storeKey] = new MoleculeStorage(this.options.typeArgs)
        }
        break
      case 'witness':
        if (this.options && 'witness' in this.options && isCodecConfig(this.options.witness)) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore for Type instantiation is excessively deep and possibly infinite.
          this.#moleculeStorageCache[storeKey] = new MoleculeStorage(this.options.witness)
        }
        break
      default:
        break
    }
    return this.#moleculeStorageCache[storeKey]
  }
}
