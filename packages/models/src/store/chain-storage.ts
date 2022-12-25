// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data<T = any> = { data: T }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Witness<T = any> = { witness: T }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StorageTemplate<T = any> = Data<T> | Witness<T> | (Data<T> & Witness<T>)

export type StorageType<T extends StorageTemplate> = T extends Data & Witness
  ? {
      offChain: { data: T['data']; witness: T['witness'] }
      onChain: { data: Uint8Array; witness: Uint8Array }
    }
  : T extends Data
  ? {
      offChain: { data: T['data'] }
      onChain: { data: Uint8Array }
    }
  : T extends Witness
  ? {
      offChain: { witness: T['witness'] }
      onChain: { witness: Uint8Array }
    }
  : never

export abstract class ChainStorage<T extends StorageTemplate = StorageTemplate> {
  abstract serialize(data: StorageType<T>['offChain']): StorageType<T>['onChain']
  abstract deserialize(data: StorageType<T>['onChain']): StorageType<T>['offChain']
  clone(data: StorageType<T>['offChain']): StorageType<T>['offChain'] {
    return this.deserialize(this.serialize(data))
  }
}

export type GetState<T> = T extends ChainStorage<infer State> ? StorageType<State>['offChain'] : never
