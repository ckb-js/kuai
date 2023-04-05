/**
 * @tutorial https://github.com/ckb-js/kuai/issues/17#issuecomment-1305896619
 */
import fs from 'node:fs'
import { resolve } from 'node:path'

import { Container } from 'inversify'
import type { ActorURI, ConstructorFunction } from './interface'
import type { Actor } from './actor'
import {
  ActorNotFoundException,
  DuplicatedActorException,
  ProviderKey,
  ActorParamType,
  InvalidActorURIException,
  InvalidActorException,
} from '../utils'
import { Router } from './router'
import { ActorReference } from './actor-reference'

export class Registry {
  #actors: Set<ActorURI> = new Set()
  #container: Container = new Container({ skipBaseClassChecks: true })
  #router = new Router()

  #find = <T extends Actor = Actor>(ref: ActorReference, bind = false): T | undefined => {
    try {
      return this.#container.get<T>(ref.uri)
    } catch (e) {
      console.log('Registry `find` catch error', e)
      if (bind) {
        const { module, parsedRef } = this.#router.matchFirst(ref)
        if (!module) {
          throw new ActorNotFoundException(ref.uri)
        }
        this.#bind(parsedRef, module)
        const actor = this.#container.get<T>(parsedRef.uri)
        return actor
      }
      return undefined
    }
  }

  isLive = (uri: ActorURI): boolean => {
    return this.#actors.has(uri)
  }

  find = <T extends Actor = Actor>(ref: ActorReference): T | undefined => this.#find(ref)

  findOrBind = <T extends Actor = Actor>(ref: ActorReference): T => {
    const actor = this.#find<T>(ref, true)
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
      const metadata = Reflect.getMetadata(ProviderKey.Actor, module)
      if (metadata?.ref) {
        this.#router.addPath(metadata.ref, module)
      }
      if (metadata?.bindWhenBootstrap) {
        this.#bind(metadata.ref, module)
      }
    }
  }

  /**
   * this method is defined as public for testing
   */
  bind = (module: ConstructorFunction): void => {
    this.#bind(Reflect.getMetadata(ProviderKey.Actor, module)?.ref, module)
  }

  #bind = (ref: ActorReference, module: ConstructorFunction): void => {
    if (!module) {
      throw new InvalidActorException()
    }

    if (!(ref instanceof ActorReference)) {
      throw new InvalidActorURIException(ref)
    }

    if (this.isLive(ref.uri)) {
      throw new DuplicatedActorException(ref.uri)
    }

    const params = Reflect.getMetadata(ProviderKey.ActorParam, module)
    if (!params) {
      this.#container.bind(ref.uri).to(module).inSingletonScope()
    } else {
      this.#container
        .bind(ref.uri)
        .toDynamicValue(() =>
          module
            ? new module(
                ...(params as ActorParamType[]).map((param) => param.routerParam).map((param) => ref.params[param]),
              )
            : undefined,
        )
        .inSingletonScope()
    }

    this.#actors.add(ref.uri)
  }
}
