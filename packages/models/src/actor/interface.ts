import { Behavior } from '../utils'

export type ActorName = string | symbol
export type ActorURI = string

export interface ActorRef {
  name: ActorName
  protocol: string
  path: string
  uri: ActorURI
}

export type MessagePayload<Payload = string | number | object> = {
  pattern: string
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
