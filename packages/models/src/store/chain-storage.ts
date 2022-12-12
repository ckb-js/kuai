type AtLeastOneOfLoc<Data, Witness = Data> = { data: Data; witness?: Witness } | { data?: Data; witness: Witness }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type StorageOffChain<Data = any, Witness = Data> = AtLeastOneOfLoc<Data, Witness>
export type StorageOnChain = AtLeastOneOfLoc<Uint8Array>

export abstract class ChainStorage<Data extends StorageOffChain = StorageOffChain> {
  abstract serialize(data: Data): StorageOnChain
  abstract deserialize(data: StorageOnChain): Data
  clone(data: Data): Data {
    return this.deserialize(this.serialize(data))
  }
}

export type GetState<T> = T extends ChainStorage<infer State> ? State : never
