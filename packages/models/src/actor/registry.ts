/**
 * @tutorial https://github.com/ckb-js/kuai/issues/17#issuecomment-1305896619
 */
import fs from 'node:fs'
import { resolve } from 'node:path'

import { Container } from 'inversify'
import type { ActorRef, ActorURI } from './interface'
import type { Actor } from './actor'
import { DuplicatedActorException, InvalidActorURIException, ProviderKey } from '../utils'

export class Registry {
  #actors: Set<ActorURI> = new Set()
  #container: Container = new Container({ skipBaseClassChecks: true })

  isLive = (uri: ActorURI): boolean => {
    return this.#actors.has(uri)
  }

  find = <T extends Actor = Actor>(
    ref: ActorRef,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    module: new (ref?: ActorRef | undefined, ...args: Array<any>) => unknown,
    bind = false,
  ): T | undefined => {
    try {
      return this.#container.get<T>(ref.uri)
    } catch (e) {
      console.log('Registry `find` catch error', e)
      if (bind) {
        this.#bind(module, { ref })
        const actor = this.#container.get<T>(ref.uri)
        return actor
      }
      return undefined
    }
  }

  findOrBind = <T extends Actor = Actor>(
    ref: ActorRef,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    module: new (ref?: ActorRef | undefined, ...args: Array<any>) => unknown,
  ): T => {
    const actor = this.find<T>(ref, module, true)
    if (!actor) throw new Error('module bind error')
    return actor
  }

  list = (): IterableIterator<ActorURI> => {
    return this.#actors.keys()
  }

  // TODO: this method is not tested
  load = (path: string): void => {
    if (fs.statSync(path).isDirectory()) {
      fs.readdirSync(path).forEach((sub) => this.load(resolve(path, sub)))
      return
    }

    if (!/\.(js|ts)$/.test(path)) return
    /**
     * require used here to load modules synchronously so the users don't have to use a promise on launch
     */
    /* eslint-disable-next-line @typescript-eslint/no-var-requires */
    const exports = require(path)

    for (const m in exports) {
      const module = exports[m]
      if (typeof module !== 'function') continue
      this.#bind(module)
    }
  }

  /**
   * this method is defined as public for testing
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bind = (module: new (ref?: ActorRef | undefined, ...args: Array<any>) => unknown): void =>
    this.#bind(module, Reflect.getMetadata(ProviderKey.Actor, module))

  #bind = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    module: new (ref?: ActorRef | undefined, ...args: Array<any>) => unknown,
    metadata?: Record<'ref', ActorRef>,
  ): void => {
    if (!metadata) return
    if (!metadata.ref.uri) {
      throw new InvalidActorURIException(metadata.ref.uri)
    }
    if (this.isLive(metadata.ref.uri)) {
      throw new DuplicatedActorException(metadata.ref.uri)
    }
    this.#container
      .bind(metadata.ref.uri)
      .toDynamicValue(() => new module(metadata.ref))
      .inSingletonScope()

    this.#actors.add(metadata.ref.uri)
  }
}
