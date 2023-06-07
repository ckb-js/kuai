import BigNumber from 'bignumber.js'
import { UnexpectedMarkException, UnexpectedParamsException, UnexpectedTypeException } from '../exceptions'
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

export function reviver(key: string, value: JSONStorageOffChain | JSONStorageType) {
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
  if (data === null || data === undefined) throw new UnexpectedTypeException(`${data}`)
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

export class JSONStorage<T extends JSONStorageOffChain> extends ChainStorage<T> {
  serialize(data: T): Uint8Array {
    return Buffer.from(JSON.stringify(data))
  }

  deserialize(data: Uint8Array): T {
    if (data === null || data === undefined) throw new UnexpectedParamsException(`${data}`)
    const json = Buffer.from(data).toString()
    if (json === '') throw new UnexpectedParamsException(`${data}`)
    return JSON.parse(Buffer.from(data).toString())
  }
}
