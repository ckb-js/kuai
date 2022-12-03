import { ChainStorage, StorageOnChain, StorageOffChain } from './chain-storage'

type JSONStorageType = string | number | boolean | bigint
export type JSONStorageOffChain =
  | JSONStorageType
  | {
      [x: string]: JSONStorageType | JSONStorageType[] | JSONStorageOffChain
    }

const typeMarkLen = 4
const typeMarkMap: Record<string, string> = {
  string: '0001',
  number: '0010',
  boolean: '0011',
  bigint: '0100',
}

function replacer(_: string, value: JSONStorageOffChain | JSONStorageType) {
  const valueType = typeof value
  if (valueType === 'object') return value
  const mark = typeMarkMap[valueType]
  if (mark) {
    return `${mark}${value.toString()}`
  }
  throw new Error('Unexpected type')
}

function reviver(_: string, value: JSONStorageOffChain | JSONStorageType) {
  if (typeof value === 'object') {
    return value
  }
  const mark = value.toString().slice(0, typeMarkLen)
  if (mark.length !== typeMarkLen) {
    throw new Error('Unexpected type')
  }
  const acturalValue = value.toString().slice(typeMarkLen)
  switch (mark) {
    case typeMarkMap['string']:
      return acturalValue
    case typeMarkMap['number']:
      return +acturalValue
    case typeMarkMap['boolean']:
      return acturalValue === 'true'
    case typeMarkMap['bigint']:
      return BigInt(acturalValue)
    default:
      throw new Error('Unexpected type')
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
    return {
      witness: Buffer.from(JSON.stringify(data.witness, replacer)),
    }
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
    return {
      witness: JSON.parse(witnessStr!, reviver),
    } as T
  }
}
