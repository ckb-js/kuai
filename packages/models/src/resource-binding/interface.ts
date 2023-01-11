import { ActorURI } from '../actor'
import { LockScriptHash, TypeScriptHash } from './types'

export interface ResourceBindingRegistry {
  uri: ActorURI
  pattern: string
}

export interface ResourceBindingManagerMessage {
  type: 'register' | 'revoke'
  register?: {
    typescriptHash: TypeScriptHash
    lockscriptHash: LockScriptHash
  } & ResourceBindingRegistry
  revoke?: {
    uri: ActorURI
  }
}
