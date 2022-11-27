import { Behavior } from '../utils'

export type ActorURI = string

// TODO:
export interface ActorRef {
  name: symbol | string
  protocol: string
  path: string
  uri: ActorURI
}

export type MessagePayload<Payload = string | number | object> = {
  symbol: symbol
  value?: Payload
} | null

export interface ActorMessage<Payload extends MessagePayload = MessagePayload> {
  from: ActorRef
  payload: Payload
  behavior: Behavior
  timeout?: number
}

export interface CallResponse<Message> {
  status: symbol
  message: Message
}
