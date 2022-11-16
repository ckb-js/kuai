/**
 * @tutorial https://github.com/ckb-js/kuai/issues/17#issuecomment-1305896619
 *
 * The message queue is used as a set of actors' mailboxes.
 * At this early stage, a custom queue is used for demostration, will be replaced by redis-stream
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const { scheduler } = require('node:timers/promises');

import type { Registry } from './registry';
import { Behavior } from '../utils';
import { ActorURI, ActorMessage } from './interface';

export class MessageQueue {
  #mailboxes: Map<ActorURI, Array<ActorMessage>> = new Map();
  #registry: Registry;
  #isRunning = false;

  constructor(registry: Registry) {
    this.#registry = registry;
  }

  start = async (): Promise<void> => {
    this.#isRunning = true;
    while (this.#isRunning) {
      await scheduler.wait(1000);
      [...this.#mailboxes.entries()].forEach(([uri, msgs]) => {
        if (msgs.length) {
          const actor = this.#registry.find(uri);
          if (!actor) {
            throw new Error('Actor is not found');
          }

          const msg = msgs.shift();
          if (msg) {
            switch (msg.behavior) {
              case Behavior.Call: {
                actor.handleCall(msg);
                break;
              }
              case Behavior.Cast: {
                actor.handleCast(msg);
                break;
              }
              default: {
                throw new Error();
              }
            }
          }
        }
      });
    }
    return;
  };

  stop = (): void => {
    this.#isRunning = false;
    return;
  };

  push = (to: ActorURI, msg: ActorMessage): void => {
    if (!this.#registry.isLive(to)) {
      throw new Error(`Actor ${to} is not found`);
    }

    const mailbox = this.#mailboxes.get(to);

    if (!Array.isArray(mailbox)) {
      this.#mailboxes.set(to, [msg]);
      return;
    }

    mailbox.push(msg);
    return;
  };
}
