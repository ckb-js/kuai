import type { ActorURI } from '../actor'
import type { LockScriptHash, TypeScriptHash, RegistryStatus } from './types'

export interface ResourceBindingRegistry {
  uri: ActorURI
  pattern: string
  status?: RegistryStatus
}

interface RegisterMessage {
  type: 'register'
  register: {
    typeScriptHash: TypeScriptHash
    lockScriptHash: LockScriptHash
  } & ResourceBindingRegistry
}

interface RevokeMessage {
  type: 'revoke'
  revoke: {
    uri: ActorURI
  }
}

export type ResourceBindingManagerMessage = RegisterMessage | RevokeMessage
