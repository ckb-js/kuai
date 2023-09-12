import type { ActorRef, ActorName, ActorURI, ConstructorFunction } from './interface'
import { basename } from 'node:path'
import { InvalidActorURIException, InvalidPathException, PROTOCOL, ProviderKey } from '../utils'
import { matchParams } from '@ckb-js/kuai-io'
import { Route } from '@ckb-js/kuai-io/lib/types'

export class ActorReference {
  static fromURI = (uri: string): ActorReference => {
    // TODO: add validation
    const splitUri = uri.split('://')
    if (splitUri.length < 2) {
      throw new InvalidActorURIException(uri)
    }
    const protocol = splitUri[0]
    const name = basename(uri)
    const path = uri.slice(protocol.length + 2, -1 * name.length)
    return new ActorReference(name, path, protocol)
  }

  static newWithPattern(module: ConstructorFunction, path = '/'): ActorReference | undefined {
    const pattern = Reflect.getMetadata(ProviderKey.Actor, module)?.ref
    if (!pattern || !(pattern instanceof ActorReference)) return
    const ref = new ActorReference(pattern.name, path, pattern.protocol)
    const route = Reflect.getMetadata(ProviderKey.ActorRoute, module)

    if (route) {
      ref.matchParams(route)
    }
    return ref
  }

  static newWithFilter = this.newWithPattern

  #name: ActorName
  #path: string
  #protocol: string
  #uri: ActorURI
  #params: Record<string, string> = {}

  get name(): ActorName {
    return this.#name
  }

  get path(): string {
    return this.#path
  }

  get protocol(): string {
    return this.#protocol
  }

  get uri(): ActorURI {
    return this.#uri
  }

  get params(): Record<string, string> {
    return this.#params
  }

  get json(): ActorRef {
    return {
      name: this.name,
      path: this.path,
      protocol: this.protocol,
      uri: this.uri,
      params: this.params,
    }
  }

  constructor(name: ActorName, path = '/', protocol: string = PROTOCOL.LOCAL) {
    // TODO: add more validation
    this.#name = name
    this.#protocol = protocol
    this.#path = path

    if (this.#path !== '/' && !/^\/([\w:]+\/)*$/.test(this.#path)) {
      throw new InvalidPathException(this.#path)
    }

    this.#uri = this.#protocol + ':/' + this.#path + this.#name.toString()
  }

  matchParams(route: Route): Record<string, string> {
    const path = `${this.#path}${this.#name.toString()}`
    this.#params = matchParams({ path, route })

    return this.#params
  }

  toString(): string {
    return this.uri
  }

  clone(): ActorReference {
    const ref = new ActorReference(this.name, this.#path, this.#protocol)
    ref.#params = this.#params

    return ref
  }
}
