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
  NonExistentCellException,
  NonExistentException,
  NonStorageInstanceException,
  NoSchemaException,
  UnmatchLengthException,
} from '../exceptions'
import { ProviderKey, CellPattern, SchemaPattern } from '../utils'

const ByteCharLen = 2

export function getUint8ArrayfromHex(value: string, offset: ByteLength, length: ByteLength) {
  return bytes.bytify(
    `0x${value.slice(2 + offset * ByteCharLen, length ? 2 + offset * ByteCharLen + length * ByteCharLen : undefined)}`,
  )
}

export class Store<
  StorageT extends ChainStorage,
  StructSchema extends StorageSchema<GetState<StorageT>>,
  Option = never,
> extends Actor<GetStorageStruct<StructSchema>, MessagePayload<StoreMessage>> {
  protected states: Record<OutPointString, GetStorageStruct<StructSchema>>
  protected chainData: Record<OutPointString, UpdateStorageValue>

  protected options?: Option

  protected schemaOption?: GetStorageOption<StructSchema>

  protected cellPattern?: CellPattern

  protected schemaPattern?: SchemaPattern

  constructor(
    schemaOption: GetStorageOption<StructSchema>,
    params?: {
      states?: Record<OutPointString, GetStorageStruct<StructSchema>>
      chainData?: Record<OutPointString, UpdateStorageValue>
      cellPattern?: CellPattern
      schemaPattern?: SchemaPattern
      options?: Option
    },
  ) {
    super()
    this.cellPattern = Reflect.getMetadata(ProviderKey.CellPattern, this.constructor) || params?.cellPattern
    this.schemaPattern = Reflect.getMetadata(ProviderKey.SchemaPattern, this.constructor) || params?.schemaPattern
    this.schemaOption = schemaOption
    this.states = params?.states || {}
    this.chainData = params?.chainData || {}
    this.options = params?.options
  }

  private getOffsetAndLength(option: unknown): [ByteLength, ByteLength] {
    if (typeof option !== 'object' || option === null) return [0, 0]
    const offset = 'offset' in option && typeof option.offset === 'number' ? option.offset : 0
    const length = 'length' in option && typeof option.length === 'number' ? option.length : 0
    return [offset, length]
  }

  private deserializeField(type: StorageLocation, option: unknown, value: string) {
    this.assetStorage(this.getStorage(type))
    const [offset, length] = this.getOffsetAndLength(option)
    return this.getStorage(type)?.deserialize(getUint8ArrayfromHex(value, offset, length))
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
    if (this.cellPattern && !this.cellPattern({ cell, witness })) {
      return
    }
    if (cell.outPoint) {
      const outpoint = `${cell.outPoint?.txHash}${cell.outPoint.index.slice(2)}`
      const value = this.deserializeCell({ cell, witness })
      if (this.schemaPattern && !this.schemaPattern(value)) {
        return
      }
      this.states[outpoint] = value
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

  handleCall = (_msg: ActorMessage<MessagePayload<StoreMessage>>): void => {
    switch (_msg.payload?.value?.type) {
      case 'update_cells':
        _msg.payload.value.value.forEach((cellInfo) => {
          this.addState(cellInfo)
        })
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
      if ('lockArgs' in currentStateInKey && (currentStateInKey.lockArgs ?? false) !== false) {
        this.assetStorage(this.getStorage('lockArgs'))
        states[key].lockArgs = this.getStorage('lockArgs')?.clone(currentStateInKey.lockArgs)
      }
      if ('typeArgs' in currentStateInKey && (currentStateInKey.typeArgs ?? false) !== false) {
        this.assetStorage(this.getStorage('typeArgs'))
        states[key].typeArgs = this.getStorage('typeArgs')?.clone(currentStateInKey.typeArgs)
      }
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (<any>this.constructor)(this.schemaOption, {
      states,
      options: this.options,
      chainData: this.cloneChainData(),
      cellPattern: this.cellPattern,
      schemaPattern: this.schemaPattern,
    })
  }

  get(key: OutPointString): GetFullStorageStruct<StructSchema>
  get(key: OutPointString, paths: ['data']): GetFullStorageStruct<StructSchema>['data']
  get(key: OutPointString, paths: ['witness']): GetFullStorageStruct<StructSchema>['witness']
  get(key: OutPointString, paths: ['lockArgs']): GetFullStorageStruct<StructSchema>['lockArgs']
  get(key: OutPointString, paths: ['typeArgs']): GetFullStorageStruct<StructSchema>['typeArgs']
  get(key: OutPointString, paths: [StorageLocation, ...string[]]): unknown
  get(key: OutPointString, paths?: StorePath) {
    if (paths) {
      return this.getAndValidTargetKey(key, paths)
    }
    return this.states[key]
  }

  set(key: OutPointString, value: GetStorageStruct<StructSchema>): void
  set(key: OutPointString, value: GetFullStorageStruct<StructSchema>['data'], paths: ['data']): void
  set(key: OutPointString, value: GetFullStorageStruct<StructSchema>['witness'], paths: ['witness']): void
  set(key: OutPointString, value: GetFullStorageStruct<StructSchema>['lockArgs'], paths: ['lockArgs']): void
  set(key: OutPointString, value: GetFullStorageStruct<StructSchema>['typeArgs'], paths: ['typeArgs']): void
  set(key: OutPointString, value: GetState<StorageT>, paths: [StorageLocation, string, ...string[]]): void
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
