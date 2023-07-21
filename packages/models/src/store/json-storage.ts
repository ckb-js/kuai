import { UnexpectedParamsException } from '../exceptions'
import { ChainStorage } from './chain-storage'

export type JSONStorageType = string
export type JSONStorageOffChain =
  | JSONStorageType
  | JSONStorageOffChain[]
  | {
      [x: string]: JSONStorageOffChain
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
