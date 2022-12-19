import { Actor, ActorMessage, MessagePayload } from '../../../'

export const Step: Record<string, string> = {
  One: 'one',
  Two: 'two',
  Done: 'done',
}

/**
 * add business logic in an actor
 */
export class CustomActorBase<
  State extends { value: number } = { value: number },
  Message extends MessagePayload = MessagePayload,
> extends Actor<State, Message> {
  #value = 0

  handleCall = (msg: ActorMessage<Message>): void => {
    console.info(`handle call request from ${msg.from.name.toString()} with pattern ${msg.payload?.pattern}`)
    /**
     * delegate msg to user defined methods, will be delegated by framework
     */
    this.#handleMsg(msg)
    this.cast(msg.from.uri, { pattern: Step.Done })
    return
  }

  handleCast = (msg: ActorMessage<Message>): void => {
    console.info(`handle cast request from ${msg.from.name.toString()} with symbol ${msg.payload?.pattern}`)
    /**
     * delegate msg to user defined methods, will be delegated by framework
     */
    this.#handleMsg(msg)
    return
  }

  #handleMsg = (msg: ActorMessage<Message>) => {
    /**
     * will be pattern-matched by @HandleCall(Step) and @HandleCast(Step)
     */
    switch (msg.payload?.pattern) {
      case Step.One: {
        console.info(`${this.ref.uri}: increment 1`)
        return this.#handleIncOne()
      }
      case Step.Two: {
        console.info(`${this.ref.uri}: increment 2`)
        return this.#handleIncTwo()
      }
      case Step.Done: {
        console.info(`task is done`)
        break
      }
      default: {
        throw new Error('Unknown message')
      }
    }
  }

  /*
   * state will be injected by framework
   */
  #handleIncOne(state = { value: this.#value }) {
    state.value += 1
    /**
     * internal state should be updated by framework with the returning value of this method
     */
    this.#value = state.value
    return state
  }

  /*
   * state will be injected by framework
   */
  #handleIncTwo(state = { value: this.#value }) {
    state.value += 2
    /**
     * internal state should be updated by framework with the returning value of this method
     */
    this.#value = state.value
    return state
  }
}
