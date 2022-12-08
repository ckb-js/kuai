import type { ActorURI, CallResponse, MessagePayload } from '../actor'

export type Params = object

export interface ContractMethod<P = string | number | object, Result = string | number | object> {
  params: MessagePayload<P>
  result: CallResponse<MessagePayload<Result>>
}

export interface ContractMethodInterface {
  [key: ActorURI]: ContractMethod
}
