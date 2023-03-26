/**
 * @module Actor models
 * @tutorial https://github.com/ckb-js/kuai/issues/4
 */

import type { ActorMessage, ActorURI, ActorRef, MessagePayload, CallResponse } from './interface'
import { injectable, Container, inject, optional } from 'inversify'
import Redis from 'ioredis'
import { ActorReference } from './actor-reference'
import { Status, Behavior, ProviderKey, SendMailException, PayloadMissingInMessageException } from '../utils'
import { ActorRefEmptyException } from '../exceptions/actor'

export const REDIS_PORT_SYMBOL = Symbol('mq_redis_port')
export const REDIS_HOST_SYMBOL = Symbol('mq_redis_host')

@injectable()
class MessageQueue {
  instance: Redis

  constructor(
    @inject(REDIS_PORT_SYMBOL) @optional() port = 6379,
    @inject(REDIS_HOST_SYMBOL) @optional() host = '127.0.0.1',
  ) {
    this.instance = new Redis(port, host)
  }
}

const MQ_SYMBOL = Symbol('mq')
export const mqContainer = new Container()
mqContainer.bind<MessageQueue>(MQ_SYMBOL).to(MessageQueue)

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

  constructor(ref?: ActorRef) {
    const metadata: { ref: ActorRef | undefined } = Reflect.getMetadata(ProviderKey.Actor, this.constructor)
    // TODO: add explicit error message
    ref = ref ?? metadata?.ref
    if (!ref) throw new ActorRefEmptyException()
    this.#ref = ref
    this.receiveMail()
  }

  /**
   * @static
   * @method
   * push a `call request` to the message queue
   */
  static call = async (
    to: ActorURI,
    from: ActorRef,
    payload: MessagePayload,
    timeout?: number,
  ): Promise<CallResponse<MessagePayload>> => {
    if (!payload) {
      throw new PayloadMissingInMessageException()
    }

    try {
      // TODO: add message hook for synchornous callback
      Actor.sendMail(from.uri, to, Behavior.Call, payload, timeout)
      return {
        status: Status.ok,
        message: payload,
      }
    } catch (e) {
      if (e instanceof Error) {
        return Promise.resolve({
          status: Status.error,
          message: payload,
        })
      }
      throw e
    }
  }

  /**
   * @static
   * @method
   * push a `cast request` to the message queue
   */
  static cast = async (to: ActorURI, from: ActorRef, payload: MessagePayload, timeout?: number): Promise<void> => {
    if (!payload) throw new PayloadMissingInMessageException()
    try {
      await Actor.sendMail(from.uri, to, Behavior.Cast, payload, timeout)
    } catch {
      throw new SendMailException(from.uri, to)
    }
  }

  /**
   * @private
   * @static sendMail
   * helper method, push a message into the message queue
   */
  private static sendMail = (
    from: string,
    to: string,
    behavior: Behavior,
    payload: MessagePayload,
    timeout?: number,
  ) => {
    // TODO: use container to instantiate redis
    return mqContainer
      .get<MessageQueue>(MQ_SYMBOL)
      .instance.xadd(
        to,
        '*',
        'from',
        from,
        'behavior',
        behavior.toString(),
        'payload',
        JSON.stringify(payload),
        'timeout',
        timeout ?? 0,
      )
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

  receiveMail = async (lastId = '$'): Promise<void> => {
    const results = await mqContainer
      .get<MessageQueue>(MQ_SYMBOL)
      .instance.xread('BLOCK', 0, 'STREAMS', this.ref.uri, lastId)

    if (!results) {
      return
    }

    const [_, messages] = results[0]
    for await (const [_key, msg] of messages) {
      if (msg.length < 6) {
        console.warn(`Invalid payload in message, expect to have 3 field-value pairs, received [${msg.join(', ')}]`)
        continue
      }
      const [_from, from, _behavior, behavior, _payload, payload, _timeout, timeout] = msg
      const p = {
        from: ActorReference.fromURI(from).json,
        payload: JSON.parse(payload),
        timeout: +(timeout ?? 0),
      }
      switch (behavior) {
        case 'call': {
          this.handleCall({ behavior: Behavior.Call, ...p })
          break
        }
        case 'cast': {
          this.handleCast({ behavior: Behavior.Cast, ...p })
          break
        }
        default: {
          console.error('Unknown behavior')
        }
      }
    }
    await this.receiveMail(messages[messages.length - 1][0])
  }
}

@injectable()
export class ActorBase extends Actor {}
