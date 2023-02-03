import { Script } from '@ckb-lumos/base'
import type { ActorURI } from '../actor'
import type { RegistryStatus } from './types'

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

export type ResourceBindingManagerMessage = RegisterMessage | RevokeMessage
