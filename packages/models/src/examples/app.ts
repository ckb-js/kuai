import { Actor, MessageQueue, Registry, ActorMessage, MessagePayload } from '../actor';

const Step: Record<string, symbol> = {
  One: Symbol('one'),
  Two: Symbol('two'),
  Done: Symbol('done'),
};

/**
 * add business logic in an actor
 */
class CustomActor<State extends { value: number }, Message extends MessagePayload> extends Actor<State, Message> {
  #value = 0;

  handleCall = (msg: ActorMessage<Message>): void => {
    console.info(`handle call request from ${msg.from.name.toString()} with symbol ${msg.payload?.symbol.toString()}`);
    /**
     * delegate msg to user defined methods, will be delegated by framework
     */
    this.#handleMsg(msg);
    this.cast(msg.from.uri, { symbol: Step.Done });
    return;
  };

  handleCast = (msg: ActorMessage<Message>): void => {
    console.info(`handle cast request from ${msg.from.name.toString()} with symbol ${msg.payload?.symbol.toString()}`);
    /**
     * delegate msg to user defined methods, will be delegated by framework
     */
    this.#handleMsg(msg);
    return;
  };

  #handleMsg = (msg: ActorMessage<Message>) => {
    /**
     * will be pattern-matched by @HandleCall(Step) and @HandleCast(Step)
     */
    switch (msg.payload?.symbol) {
      case Step.One: {
        console.info(`${this.ref.uri}: increment 1`);
        return this.#handleIncOne();
      }
      case Step.Two: {
        console.info(`${this.ref.uri}: increment 2`);
        return this.#handleIncTwo();
      }
      case Step.Done: {
        console.info(`task is done`);
        break;
      }
      default: {
        throw new Error('Unknown message');
      }
    }
  };

  /*
   * state will be injected by framework
   */
  #handleIncOne(state = { value: this.#value }) {
    state.value += 1;
    /**
     * internal state should be updated by framework with the returning value of this method
     */
    this.#value = state.value;
    return state;
  }

  /*
   * state will be injected by framework
   */
  #handleIncTwo(state = { value: this.#value }) {
    state.value += 2;
    /**
     * internal state should be updated by framework with the returning value of this method
     */
    this.#value = state.value;
    return state;
  }
}

/**
 * initialize the registry, should be done by the framework
 */
const registry = new Registry(CustomActor);

/**
 * initialize the message queue, should be done by the framekwork
 */
globalThis.mq = new MessageQueue(registry);
globalThis.mq.start();

const rootRef = registry.spawn({ name: 'root' });
const childOneRef = registry.spawn({ parent: rootRef, name: 'child_one' });

Actor.call(childOneRef.uri, rootRef, { symbol: Step.One });
