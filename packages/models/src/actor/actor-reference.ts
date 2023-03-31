import type { ActorRef, ActorName, ActorURI, ActorRefParam, ConstructorFunction } from './interface'
import { basename } from 'node:path'
import { InvalidActorURIException, InvalidPathException, PROTOCOL, ProviderKey } from '../utils'

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
    ref.matchParams(pattern)
    return ref
  }

  #name: ActorName
  #path: string
  #protocol: string
  #uri: ActorURI
  #params = new Map<string, ActorRefParam>()

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

  get params(): Map<string, ActorRefParam> | undefined {
    return this.#params
  }

  getParam(key: string): ActorRefParam | undefined {
    return this.#params.get(key)
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

    this.#params = this.#path.split('/').reduce((params, param, index) => {
      if (param.startsWith(':')) {
        param = param.slice(1)
        return params.set(param, { index })
      }
      return params
    }, new Map())
  }

  matchParams(pattern: ActorRef): Map<string, ActorRefParam> {
    if (!pattern.params) {
      return new Map()
    }

    const paths = this.#path.split('/')
    pattern.params.forEach((param, key) => {
      this.#params.set(key, { ...param, value: paths[param.index] })
    })

    return this.#params
  }

  toString(): string {
    return this.uri
  }
}
