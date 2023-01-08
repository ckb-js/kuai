import type { Script } from '@ckb-lumos/base'
import { bytes } from '@ckb-lumos/codec'
import type { ActorMessage, MessagePayload } from '../actor'
import type {
  OutPointString,
  StoreMessage,
  StorePath,
  StorageSchema,
  StorageLocation,
  GetStorageStruct,
  GetFullStorageStruct,
  ScriptSchema,
  OmitByValue,
  GetStorageOption,
  UpdateStorageValue,
  GetOnChainStorage,
} from './interface'
import type { JSONStorageOffChain } from './json-storage'
import type { GetState } from './chain-storage'
import { ChainStorage } from './chain-storage'
import { Actor } from '../actor'
import { JSONStorage } from './json-storage'
import {
  NonExistentCellException,
  NonExistentException,
  NonStorageInstanceException,
  NoSchemaException,
  UnmatchLengthException,
} from '../exceptions'

type GetKeyType<T, K extends keyof T> = T & { _add: never } extends { [P in K]: T[P] } ? T[K] : never

export function getUint8ArrayfromHex(value: string, offset: number, length: number) {
  return bytes.bytify(`0x${value.slice(2 + offset, length ? 2 + offset + length : undefined)}`)
}

export class Store<
  StorageT extends ChainStorage,
  StructSchema extends StorageSchema<GetState<StorageT>>,
  Option = never,
> extends Actor<GetStorageStruct<StructSchema>, MessagePayload<StoreMessage>> {
  protected states: Record<OutPointString, GetStorageStruct<StructSchema>>
  protected chainData: Record<OutPointString, UpdateStorageValue>

  protected options?: Option

  protected schemaOption: GetStorageOption<StructSchema>

  constructor(
    schemaOption: GetStorageOption<StructSchema>,
    params?: {
      states?: Record<OutPointString, GetStorageStruct<StructSchema>>
      chainData?: Record<OutPointString, UpdateStorageValue>
      options?: Option
    },
  ) {
    super()
    this.schemaOption = schemaOption
    this.states = params?.states || {}
    this.chainData = params?.chainData || {}
    this.options = params?.options
  }

  private getOffsetAndLength(option: unknown): [number, number] {
    if (typeof option !== 'object' || option === null) return [0, 0]
    if (
      'offset' in option &&
      typeof option.offset === 'number' &&
      'length' in option &&
      typeof option.length === 'number'
    ) {
      return [option.offset || 0, option.length || 0]
    }
    if ('offset' in option && typeof option.offset === 'number') {
      return [option.offset || 0, 0]
    }
    if ('length' in option && typeof option.length === 'number') {
      return [0, option.length || 0]
    }
    return [0, 0]
  }

  private deserializeScript<T extends 'lock' | 'type'>(
    scriptValue: Script,
    scriptOption: unknown,
    type: T,
  ): GetFullStorageStruct<StructSchema>[T] {
    if (typeof scriptOption !== 'object' || scriptOption === null) throw new Error()
    const res = {} as GetFullStorageStruct<StructSchema>[T]
    if ('args' in scriptOption) {
      this.assetStorage(this.getStorage([type, 'args']))
      const [offset, length] = this.getOffsetAndLength(scriptOption.args)
      res['args'] = this.getStorage([type, 'args'])?.deserialize(getUint8ArrayfromHex(scriptValue.args, offset, length))
    }
    if ('codeHash' in scriptOption) {
      this.assetStorage(this.getStorage([type, 'codeHash']))
      const [offset, length] = this.getOffsetAndLength(scriptOption.codeHash)
      res['codeHash'] = this.getStorage([type, 'codeHash'])?.deserialize(
        getUint8ArrayfromHex(scriptValue.codeHash, offset, length),
      )
    }
    return res
  }

  private deserializeCell({ cell, witness }: UpdateStorageValue): GetStorageStruct<StructSchema> {
    const res: Record<string, unknown> = {}
    if ('data' in this.schemaOption) {
      this.assetStorage(this.getStorage('data'))
      const [offset, length] = this.getOffsetAndLength(this.schemaOption.data)
      res.data = this.getStorage('data')?.deserialize(getUint8ArrayfromHex(cell.data, offset, length))
    }
    if ('witness' in this.schemaOption) {
      this.assetStorage(this.getStorage('witness'))
      const [offset, length] = this.getOffsetAndLength(this.schemaOption.witness)
      res.witness = this.getStorage('witness')?.deserialize(getUint8ArrayfromHex(witness, offset, length))
    }
    if ('lock' in this.schemaOption) {
      res.lock = this.deserializeScript<'lock'>(cell.cellOutput.lock, this.schemaOption.lock, 'lock')
    }
    if ('type' in this.schemaOption && cell.cellOutput.type) {
      res.type = this.deserializeScript<'type'>(cell.cellOutput.type, this.schemaOption.type, 'type')
    }
    return res as GetStorageStruct<StructSchema>
  }

  private addState({ cell, witness }: UpdateStorageValue) {
    if (cell.outPoint) {
      const outpoint = `${cell.outPoint?.txHash}${cell.outPoint.index.slice(2)}`
      this.states[outpoint] = this.deserializeCell({ cell, witness })
      this.chainData[outpoint] = { cell, witness }
    }
  }

  private removeState(keys: OutPointString[]) {
    keys.forEach((key) => {
      delete this.states[key]
      delete this.chainData[key]
    })
  }

  private getAndValidTargetKey(key: OutPointString, paths: StorePath, ignoreLast?: boolean) {
    if (ignoreLast && paths.length === 1) return this.states[key]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any = (this.states[key] as any)?.[paths[0]]
    for (let i = 1; i < (ignoreLast ? paths.length - 1 : paths.length); i++) {
      result = result?.[paths[i]]
    }
    if (result === undefined || result === null) {
      throw new NonExistentException(`${key}:${paths.join('.')}`)
    }
    return result
  }

  private cloneScript<T extends 'lock' | 'type'>(scriptValue: unknown, type: T): GetFullStorageStruct<StructSchema>[T] {
    if (typeof scriptValue !== 'object' || scriptValue === null) throw new Error()
    const res = {} as GetFullStorageStruct<StructSchema>[T]
    if ('args' in scriptValue) {
      this.assetStorage(this.getStorage([type, 'args']))
      res['args'] = this.getStorage([type, 'args'])?.clone(scriptValue.args)
    }
    if ('codeHash' in scriptValue) {
      this.assetStorage(this.getStorage([type, 'codeHash']))
      res['codeHash'] = this.getStorage([type, 'codeHash'])?.clone(scriptValue.codeHash)
    }
    return res
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
      if ('lock' in value) {
        this.updateScriptInCell('lock', key, value.lock)
      }
      if ('type' in value) {
        this.updateScriptInCell('type', key, value.type)
      }
    } else {
      switch (paths[0]) {
        case 'data':
        case 'witness':
          this.updateValueInCell(paths[0], key, this.get(key, [paths[0]]))
          break
        case 'lock':
        case 'type':
          this.updateScriptInCell(paths[0], key, this.get(key)[paths[0]])
          break
        default:
          break
      }
    }
  }

  private updateScriptInCell(
    type: 'lock' | 'type',
    key: OutPointString,
    newValue: GetFullStorageStruct<StructSchema>['lock'] | GetFullStorageStruct<StructSchema>['type'],
  ) {
    if ('args' in newValue) {
      this.updateValueInCell([type, 'args'], key, newValue.args)
    }
    if ('codeHash' in newValue) {
      this.updateValueInCell([type, 'codeHash'], key, newValue.codeHash)
    }
  }

  private updateValueInCell(type: StorageLocation, key: OutPointString, newValue: unknown) {
    const cellInfo = this.chainData[key]
    if (!cellInfo) throw new NonExistentCellException(key)
    if (typeof type === 'string') {
      const { offset, length, hexString } = this.serializeField(type, newValue)
      if (type === 'data') {
        cellInfo.cell.data =
          cellInfo.cell.data.slice(0, 2 + offset) +
          hexString.slice(2) +
          (length ? cellInfo.cell.data.slice(2 + offset + length) : '')
      } else {
        cellInfo.witness =
          cellInfo.witness.slice(0, 2 + offset) +
          hexString.slice(2) +
          (length ? cellInfo.witness.slice(2 + offset + length) : '')
      }
    } else {
      const { offset, length, hexString } = this.serializeField(type, newValue)
      if (type[0] === 'lock') {
        const originalValue = cellInfo.cell.cellOutput.lock[type[1]]
        cellInfo.cell.cellOutput.lock[type[1]] =
          originalValue.slice(0, 2 + offset) +
          hexString.slice(2) +
          (length ? originalValue.slice(2 + offset + length) : '')
      } else if (cellInfo.cell.cellOutput.type) {
        const originalValue = cellInfo.cell.cellOutput.type[type[1]]
        cellInfo.cell.cellOutput.type[type[1]] =
          originalValue.slice(0, 2 + offset) +
          hexString.slice(2) +
          (length ? originalValue.slice(2 + offset + length) : '')
      }
    }
  }

  private serializeField(type: StorageLocation, offChainValue: unknown) {
    this.assetStorage(this.getStorage(type))
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

  initOnChain(value: GetStorageStruct<StructSchema>): GetOnChainStorage<StructSchema> {
    const res: StorageSchema<string> = {}
    if ('data' in value) {
      const { offset, hexString } = this.serializeField('data', value.data)
      res.data = `0x${offset ? '0'.repeat(offset) : ''}${hexString.slice(2)}`
    }
    if ('witness' in value) {
      const { offset, hexString } = this.serializeField('witness', value.witness)
      res.witness = `0x${offset ? '0'.repeat(offset) : ''}${hexString.slice(2)}`
    }
    if ('lock' in value && value.lock && typeof value.lock === 'object') {
      if ('args' in value.lock) {
        const { offset, hexString } = this.serializeField(['lock', 'args'], value.lock.args)
        res.lock = { args: `0x${offset ? '0'.repeat(offset) : ''}${hexString.slice(2)}` }
      }
      if ('codeHash' in value.lock) {
        const { offset, hexString } = this.serializeField(['lock', 'codeHash'], value.lock.codeHash)
        res.lock = { ...res.lock, codeHash: `0x${offset ? '0'.repeat(offset) : ''}${hexString.slice(2)}` }
      }
    }
    if ('type' in value && value.type && typeof value.type === 'object') {
      if ('args' in value.type) {
        const { offset, hexString } = this.serializeField(['type', 'args'], value.type.args)
        res.type = { args: `0x${offset ? '0'.repeat(offset) : ''}${hexString.slice(2)}` }
      }
      if ('codeHash' in value.type) {
        const { offset, hexString } = this.serializeField(['type', 'codeHash'], value.type.codeHash)
        res.type = { ...res.type, codeHash: `0x${offset ? '0'.repeat(offset) : ''}${hexString.slice(2)}` }
      }
    }
    return res as GetOnChainStorage<StructSchema>
  }

  handleCall = (_msg: ActorMessage<MessagePayload<StoreMessage>>): void => {
    switch (_msg.payload?.value?.type) {
      case 'update_cell':
        this.addState(_msg.payload.value.value)
        break
      case 'remove_cell':
        this.removeState(_msg.payload.value.value)
        break
      default:
        break
    }
  }

  getStorage(_storeKey: StorageLocation): StorageT | undefined {
    return undefined
  }

  assetStorage(storage: StorageT | undefined) {
    if (!storage) throw new NonStorageInstanceException()
  }

  clone(): Store<StorageT, StructSchema> {
    const states: Record<OutPointString, GetFullStorageStruct<StructSchema>> = {}
    Object.keys(this.states).forEach((key) => {
      const currentStateInKey = this.states[key]
      states[key] = (states[key] || {}) as GetFullStorageStruct<StructSchema>
      if ('data' in currentStateInKey && currentStateInKey.data !== undefined) {
        this.assetStorage(this.getStorage('data'))
        states[key].data = this.getStorage('data')?.clone(currentStateInKey.data)
      }
      if ('witness' in currentStateInKey && currentStateInKey.witness !== undefined) {
        this.assetStorage(this.getStorage('witness'))
        states[key].witness = this.getStorage('witness')?.clone(currentStateInKey.witness)
      }
      if ('lock' in currentStateInKey && (currentStateInKey.lock ?? false) !== false) {
        states[key].lock = this.cloneScript<'lock'>(currentStateInKey.lock, 'lock')
      }
      if ('type' in currentStateInKey && (currentStateInKey.type ?? false) !== false) {
        states[key].type = this.cloneScript<'type'>(currentStateInKey.type, 'type')
      }
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (<any>this.constructor)(this.schemaOption, {
      states,
      options: this.options,
      chainData: this.cloneChainData(),
    })
  }

  get(key: OutPointString): GetFullStorageStruct<StructSchema>
  get(key: OutPointString, paths: ['data']): GetFullStorageStruct<StructSchema>['data']
  get(key: OutPointString, paths: ['witness']): GetFullStorageStruct<StructSchema>['witness']
  get(key: OutPointString, paths: ['lock', 'args']): GetKeyType<GetFullStorageStruct<StructSchema>['lock'], 'args'>
  get(
    key: OutPointString,
    paths: ['lock', 'codeHash'],
  ): GetKeyType<GetFullStorageStruct<StructSchema>['lock'], 'codeHash'>
  get(key: OutPointString, paths: ['type', 'args']): GetKeyType<GetFullStorageStruct<StructSchema>['type'], 'args'>
  get(
    key: OutPointString,
    paths: ['type', 'codeHash'],
  ): GetKeyType<GetFullStorageStruct<StructSchema>['type'], 'codeHash'>
  get(key: OutPointString, paths: ['data' | 'witness', ...string[]]): unknown
  get(key: OutPointString, paths: ['type' | 'lock', keyof ScriptSchema, ...string[]]): unknown
  get(key: OutPointString, paths?: StorePath) {
    if (paths) {
      return this.getAndValidTargetKey(key, paths)
    }
    return this.states[key]
  }

  set(key: OutPointString, value: GetStorageStruct<StructSchema>): void
  set(key: OutPointString, value: GetFullStorageStruct<StructSchema>['data'], paths: ['data']): void
  set(key: OutPointString, value: GetFullStorageStruct<StructSchema>['witness'], paths: ['witness']): void
  set(
    key: OutPointString,
    value: GetKeyType<GetFullStorageStruct<StructSchema>['lock'], 'args'>,
    paths: ['lock', 'args'],
  ): void
  set(
    key: OutPointString,
    value: GetKeyType<GetFullStorageStruct<StructSchema>['lock'], 'codeHash'>,
    paths: ['lock', 'codeHash'],
  ): void
  set(
    key: OutPointString,
    value: GetKeyType<GetFullStorageStruct<StructSchema>['type'], 'args'>,
    paths: ['type', 'args'],
  ): void
  set(
    key: OutPointString,
    value: GetKeyType<GetFullStorageStruct<StructSchema>['type'], 'codeHash'>,
    paths: ['type', 'codeHash'],
  ): void
  set(key: OutPointString, value: GetState<StorageT>, paths: ['data' | 'witness', string, ...string[]]): void
  set(
    key: OutPointString,
    value: GetState<StorageT>,
    paths: ['type' | 'lock', keyof ScriptSchema, string, ...string[]],
  ): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: OutPointString, value: any, paths?: StorePath) {
    if (paths) {
      const target = this.getAndValidTargetKey(key, paths, true)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const lastKey = paths.at(-1)!
      target[lastKey] = value
    } else {
      if (!this.states[key]) throw new NonExistentException(key)
      this.states[key] = value
    }
    this.updateChainData(key, paths)
  }

  getChainData(key: OutPointString) {
    return this.chainData[key]
  }
}

type IsUnknownOrNever<T> = T extends never ? true : unknown extends T ? (0 extends 1 & T ? false : true) : false

type GetStorageStructByTemplate<T extends StorageSchema> = OmitByValue<{
  data: IsUnknownOrNever<T['data']> extends true ? never : T['data']
  witness: IsUnknownOrNever<T['witness']> extends true ? never : T['witness']
  lock: IsUnknownOrNever<T['lock']> extends true ? never : T['lock']
  type: IsUnknownOrNever<T['type']> extends true ? never : T['type']
}>

export class JSONStore<R extends StorageSchema<JSONStorageOffChain>> extends Store<
  JSONStorage<JSONStorageOffChain>,
  GetStorageStructByTemplate<R>
> {
  getStorage(_storeKey: StorageLocation): JSONStorage<JSONStorageOffChain> {
    return new JSONStorage()
  }
}
