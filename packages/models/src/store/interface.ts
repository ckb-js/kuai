export type OutPointString = string

export interface StoreMessage<State extends any> {
  type: 'add_state' | 'remove_state'
  add?: Record<OutPointString, State>
  remove?: OutPointString[]
}

export type StatePath = { key: OutPointString, path?: string }

