import type { ActorRef, ActorName, ActorURI, ActorRefParam } from './interface'
import { basename } from 'node:path'
import { InvalidActorURIException, InvalidPathException, PROTOCOL } from '../utils'

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

  #name: ActorName
  #path: string
  #protocol: string
  #uri: ActorURI
  #params: ActorRefParam[]

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

  get params(): ActorRefParam[] {
    return this.#params
  }

  get json(): ActorRef {
    return {
      name: this.name,
      path: this.path,
      protocol: this.protocol,
      uri: this.uri,
      params: this.#params,
    }
  }

  constructor(name: ActorName, path = '/', protocol: string = PROTOCOL.LOCAL) {
    // TODO: add more validation
    this.#name = name
    this.#protocol = protocol
    this.#path = path

    if (this.#path !== '/' && !/^\/(?:[\w-]+\/)*(?::\w+\/?)?(?:[\w-]+\/)*(?::\w+\/?)?$/.test(this.#path)) {
      throw new InvalidPathException(this.#path)
    }

    this.#uri = this.#protocol + ':/' + this.#path + this.#name.toString()

    this.#params = this.#uri
      .split('/')
      .filter((segment) => segment.startsWith(':'))
      .map((param, index) => {
        return { param: param.slice(1), index }
      })
  }

  toString(): string {
    return this.uri
  }
}
