import type { ActorURI, CallResponse, MessagePayload } from '../actor'

type ContractParams = string | number | object

export type ContractPayload = {
  method?: string
  params?: ContractParams
}

export interface ContractMethod<P = ContractParams, Result = unknown> {
  params?: P
  result: CallResponse<MessagePayload<Result>>
}

export interface ContractMethodInterface {
  [key: ActorURI]: ContractMethod
}

export const REMOTE_CALL_PATTERN = 'remote_call'
