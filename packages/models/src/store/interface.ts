export type OutPointString = string

export type StorePath = ['data' | 'witness', ...string[]]

export interface StoreMessage<State> {
  type: 'add_state' | 'remove_state'
  add?: Record<OutPointString, State>
  remove?: OutPointString[]
}
