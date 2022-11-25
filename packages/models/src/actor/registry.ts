/**
 * @tutorial https://github.com/ckb-js/kuai/issues/17#issuecomment-1305896619
 *
 * The registry is used as an IoC of actors
 * At this early stage, a custom registry is used for demostration, will be replaced by inversify
 */

import { ActorRef, ActorURI } from './interface'
import type { Actor, ActorConstructor } from './actor'

export class Registry {
  #actors: Map<ActorURI, Actor> = new Map()
  #actorConstructor: ActorConstructor

  constructor(actorConstructor: ActorConstructor) {
    this.#actorConstructor = actorConstructor
  }

  spawn = ({ parent, name }: Partial<{ parent: ActorRef; name: string | symbol }>): ActorRef => {
    // TODO: use IoC to spawn an actor
    const actor = new this.#actorConstructor(parent, name)
    const ref = actor.ref
    this.#actors.set(ref.uri, actor)
    return ref
  }

  find = (uri: ActorURI): Actor | undefined => {
    if (this.isLive(uri)) {
      return this.#actors.get(uri)
    }
    return undefined
  }

  list = (): IterableIterator<ActorURI> => {
    return this.#actors.keys()
  }

  isLive = (uri: ActorURI): boolean => {
    return this.#actors.has(uri)
  }
}
