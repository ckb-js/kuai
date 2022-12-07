import type { StorageOnChain, StorageOffChain } from './chain-storage'
import { NoExpectedDataException, UnexpectedMarkException, UnexpectedTypeException } from '../exceptions'
import { ChainStorage } from './chain-storage'

type JSONStorageType = string | number | boolean | bigint
export type JSONStorageOffChain =
  | JSONStorageType
  | {
      [x: string]: JSONStorageType | JSONStorageType[] | JSONStorageOffChain
    }

const TYPE_MARK_LEN = 4
const TYPE_MARK_MAP: Record<string, string> = {
  string: '0001',
  number: '0010',
  boolean: '0011',
  bigint: '0100',
}

function replacer(key: string, value: JSONStorageOffChain | JSONStorageType) {
  const valueType = typeof value
  if (value === null) throw new UnexpectedTypeException('null')
  if (valueType === 'object') return value
  const mark = TYPE_MARK_MAP[valueType]
  if (mark) {
    return `${mark}${value.toString()}`
  }
  throw new UnexpectedTypeException(valueType)
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
    case TYPE_MARK_MAP['number']:
      return +acturalValue
    case TYPE_MARK_MAP['boolean']:
      return acturalValue === 'true'
    case TYPE_MARK_MAP['bigint']:
      return BigInt(acturalValue)
    default:
      throw new UnexpectedMarkException(mark)
  }
}

export class JSONStorage<T extends StorageOffChain<JSONStorageOffChain>> extends ChainStorage<T> {
  serialize(data: T): StorageOnChain {
    if ('data' in data && 'witness' in data) {
      return {
        data: Buffer.from(JSON.stringify(data.data, replacer)),
        witness: Buffer.from(JSON.stringify(data.witness, replacer)),
      }
    }
    if ('data' in data) {
      return {
        data: Buffer.from(JSON.stringify(data.data, replacer)),
      }
    }
    if ('witness' in data) {
      return {
        witness: Buffer.from(JSON.stringify(data.witness, replacer)),
      }
    }
    throw new NoExpectedDataException()
  }

  deserialize(data: StorageOnChain): T {
    const dataStr = data?.data?.toString()
    const witnessStr = data?.witness?.toString()
    if (dataStr && witnessStr) {
      return {
        data: JSON.parse(dataStr, reviver),
        witness: JSON.parse(witnessStr, reviver),
      } as T
    }
    if (dataStr) {
      return {
        data: JSON.parse(dataStr, reviver),
      } as T
    }
    if (witnessStr) {
      return {
        data: JSON.parse(witnessStr, reviver),
      } as T
    }
    throw new NoExpectedDataException()
  }
}
