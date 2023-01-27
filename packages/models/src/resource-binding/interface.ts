import type { ActorURI } from '../actor'
import type { LockScriptHash, TypeScriptHash } from './types'

export interface ResourceBindingRegistry {
  uri: ActorURI
  pattern: string
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
