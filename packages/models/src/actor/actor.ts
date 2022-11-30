/**
 * @module Actor models
 * @tutorial https://github.com/ckb-js/kuai/issues/4
 */

import type { ActorMessage, ActorURI, ActorRef, MessagePayload, CallResponse } from './interface'
import { injectable } from 'inversify'
import { Status, Behavior, ProviderKey, MessageQueueNotFoundException } from '../utils'

@injectable()
export abstract class Actor<_State = unknown, Message extends MessagePayload = MessagePayload> {
  /**
   * @member
   * reference of the actor
   */
  #ref: ActorRef

  /**
   * @access
   * reference to the actor
   */
  public get ref(): ActorRef {
    return this.#ref
  }

  constructor() {
    const metadata: { ref: ActorRef | undefined } = Reflect.getMetadata(ProviderKey.Actor, this.constructor)
    // TODO: add explicit error message
    if (!metadata?.ref?.uri) throw new Error()
    this.#ref = metadata?.ref
  }

  /**
   * @static
   * @method
   * push a `call request` to the message queue
   */
  static call = (
    to: ActorURI,
    from: ActorRef,
    payload: MessagePayload,
    timeout?: number,
  ): Promise<CallResponse<MessagePayload>> => {
    /**
     * TODO: A global mq object is used in this early stage, will be replaced by a mq service.
     */
    if (globalThis.mq) {
      globalThis.mq.push(to, { from, payload, behavior: Behavior.Call, timeout })
      return Promise.resolve({
        status: Status.ok,
        message: null,
      })
    }

    return Promise.resolve({
      status: Status.error,
      message: null,
    })
  }

  /**
   * @static
   * @method
   * push a `cast request` to the message queue
   */
  static cast(to: ActorURI, from: ActorRef, payload: MessagePayload, timeout?: number): Promise<void> | void {
    /**
     * TODO: A global mq object is used in this early stage, will be replaced by a mq service.
     */
    if (globalThis.mq) {
      globalThis.mq.push(to, { from, payload, behavior: Behavior.Cast, timeout })
      return
    }

    throw new MessageQueueNotFoundException()
  }

  /**
   * @method
   * push a `call request` to the message queue through `Actor.call`
   */
  call(to: ActorURI, payload: MessagePayload, timeout?: number): Promise<CallResponse<MessagePayload>> {
    return Actor.call(to, this.ref, payload, timeout)
  }

  /**
   * @method
   * push a `cast request` to the message queue through `Actor.cast`
   */
  cast(to: ActorURI, payload: MessagePayload, timeout?: number): void {
    Actor.cast(to, this.ref, payload, timeout)
  }

  /**
   * @method
   * method to handle unified call request, and delegate messages to user defined methods which are decorated by `@HandleCall(pattern)`
   */
  handleCall = (_msg: ActorMessage<Message>): void => {
    // TODO: delegate to other inner methods decorated by @HandleCall
    return
  }

  /**
   * @method
   * method to handle unified cast request, and delegate messages to user defined methods which are decorated by `@HandleCast(pattern)`
   */
  handleCast = (_msg: ActorMessage<Message>): void => {
    // TODO: delegate to other inner methods decorated by @HandleCast
    return
  }
}

@injectable()
export class ActorBase extends Actor {}
