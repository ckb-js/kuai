
type OneOfStorageLoc<Data, Witness = Data> = { data: Data; witness?: Witness } | { data?: Data; witness: Witness }
export type StorageOffChain<Data = any, Witness = Data> = OneOfStorageLoc<Data, Witness>
export type StorageOnChain = OneOfStorageLoc<Uint8Array>

export abstract class ChainStorage<Data extends StorageOffChain = StorageOffChain> {
  abstract serialize(data: Data): StorageOnChain
  abstract deserialize(data: StorageOnChain): Data
  clone(data: Data): Data {
    return this.deserialize(this.serialize(data))
  }
}