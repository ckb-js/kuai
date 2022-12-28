export type OutPointString = string

export type StorageLocation = 'data' | 'witness'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GetStorageStruct<T = any> = Partial<Record<StorageLocation, T>>

export type StorePath = [StorageLocation, ...string[]]

export interface StoreMessage<State> {
  type: 'add_state' | 'remove_state'
  add?: Record<OutPointString, State>
  remove?: OutPointString[]
}
