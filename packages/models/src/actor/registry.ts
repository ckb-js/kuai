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
  #container: Container = new Container()

  isLive = (uri: ActorURI): boolean => {
    return this.#actors.has(uri)
  }

  find = <T = Actor>(uri: ActorURI): T | undefined => {
    try {
      return this.#container.get<T>(uri)
    } catch {
      return undefined
    }
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
  bind = (module: new (...args: Array<unknown>) => unknown): void => this.#bind(module)

  #bind = (module: new (...args: Array<unknown>) => unknown): void => {
    const metadata: Record<'ref', ActorRef> | undefined = Reflect.getMetadata(ProviderKey.Actor, module)
    if (!metadata) return
    if (!metadata.ref.uri) {
      throw new InvalidActorURIException(metadata.ref.uri)
    }
    if (this.isLive(metadata.ref.uri)) {
      throw new DuplicatedActorException(metadata.ref.uri)
    }
    this.#container.bind(metadata.ref.uri).to(module)
    this.#actors.add(metadata.ref.uri)
  }
}
