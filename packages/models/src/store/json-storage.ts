import BigNumber from 'bignumber.js'
import type { StorageType, StorageTemplate } from './chain-storage'
import { NoExpectedDataException, UnexpectedMarkException, UnexpectedTypeException } from '../exceptions'
import { ChainStorage } from './chain-storage'

export type JSONStorageType = string | boolean | BigNumber
export type JSONStorageOffChain =
  | JSONStorageType
  | JSONStorageOffChain[]
  | {
      [x: string]: JSONStorageOffChain
    }

const TYPE_MARK_LEN = 1
const BIG_NUMBER_TYPE = 'bignumber'
const TYPE_MARK_MAP = {
  string: '0',
  boolean: '1',
  [BIG_NUMBER_TYPE]: '2',
}

function reviver(key: string, value: JSONStorageOffChain | JSONStorageType) {
  if (value === null) throw new UnexpectedTypeException('null')
  if (typeof value === 'object') {
    return value
  }
  const mark = value.toString().slice(0, TYPE_MARK_LEN)
  if (mark.length !== TYPE_MARK_LEN) {
    throw new UnexpectedMarkException(mark)
  }
  const acturalValue = value.toString().slice(TYPE_MARK_LEN)
  switch (mark) {
    case TYPE_MARK_MAP['string']:
      return acturalValue
    case TYPE_MARK_MAP['boolean']:
      return acturalValue === 'true'
    case TYPE_MARK_MAP['bignumber']:
      return BigNumber(acturalValue)
    default:
      throw new UnexpectedMarkException(mark)
  }
}

function serializeSimpleType(v: string | boolean) {
  const valueType = typeof v
  if (v === null) throw new UnexpectedTypeException('null')
  const mark = TYPE_MARK_MAP[valueType as keyof typeof TYPE_MARK_MAP]
  if (mark) {
    return `${mark}${v.toString()}`
  }
  throw new UnexpectedTypeException(valueType)
}

type AddMarkStorage = string | AddMarkStorage[] | { [key: string]: AddMarkStorage }

export function addMarkForStorage(data?: JSONStorageOffChain): AddMarkStorage {
  if (data === null || data === undefined) throw new UnexpectedTypeException('null or undefined')
  if (data instanceof BigNumber) return `${TYPE_MARK_MAP[BIG_NUMBER_TYPE]}${data.toFixed()}`
  if (typeof data !== 'object') return serializeSimpleType(data)
  if (Array.isArray(data)) {
    return data.map((v) => addMarkForStorage(v))
  }
  const newData: Record<string, AddMarkStorage> = {}
  Object.keys(data).forEach((key: string) => {
    newData[key] = addMarkForStorage(data[key])
  })
  return newData
}

export class JSONStorage<T extends StorageTemplate<JSONStorageOffChain>> extends ChainStorage<T> {
  serialize(data: StorageType<T>['offChain']): StorageType<T>['onChain'] {
    if ('data' in data && 'witness' in data) {
      return {
        data: Buffer.from(JSON.stringify(addMarkForStorage(data.data))),
        witness: Buffer.from(JSON.stringify(addMarkForStorage(data.witness))),
      }
    }
    if ('data' in data) {
      return {
        data: Buffer.from(JSON.stringify(addMarkForStorage(data.data))),
      }
    }
    if ('witness' in data) {
      return {
        witness: Buffer.from(JSON.stringify(addMarkForStorage(data.witness))),
      }
    }
    throw new NoExpectedDataException()
  }

  deserialize(data: StorageType<T>['onChain']): StorageType<T>['offChain'] {
    if ('data' in data && 'witness' in data) {
      return {
        data: JSON.parse(data?.data?.toString(), reviver),
        witness: JSON.parse(data?.witness?.toString(), reviver),
      } as StorageType<T>['offChain']
    }
    if ('data' in data) {
      return {
        data: JSON.parse(data?.data?.toString(), reviver),
      } as StorageType<T>['offChain']
    }
    if ('witness' in data) {
      return {
        witness: JSON.parse(data?.witness?.toString(), reviver),
      } as StorageType<T>['offChain']
    }
    throw new NoExpectedDataException()
  }
}
