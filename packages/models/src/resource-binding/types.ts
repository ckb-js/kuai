import { Cell, Hash, Input, Script } from '@ckb-lumos/base'
import { ActorURI } from '../actor'

export type TypeScriptHash = Hash | 'null'
export type LockScriptHash = Hash
export type RegistryStatus = 'registered' | 'initiated'
export type CellChangeData = [cell: Cell, witness: string]
export type CellChange = [registry: ResourceBindingRegistry, remove: Input[], update: CellChangeData[]]
export type ResourceBindingManagerMessage = RegisterMessage | RevokeMessage

export interface ResourceBindingRegistry {
  uri: ActorURI
  pattern: string
  status?: RegistryStatus
}

interface RegisterMessage {
  type: 'register'
  register: {
    typeScript: Script
    lockScript: Script
  } & ResourceBindingRegistry
}

interface RevokeMessage {
  type: 'revoke'
  revoke: {
    uri: ActorURI
  }
}
