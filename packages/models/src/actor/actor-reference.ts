import type { ActorRef, ActorName, ActorURI } from './interface'
import { InvalidPathException, PROTOCOL } from '../utils'

export class ActorReference {
  #name: ActorName
  #path: string
  #protocol: string
  #uri: ActorURI

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

  get json(): ActorRef {
    return {
      name: this.name,
      path: this.path,
      protocol: this.protocol,
      uri: this.uri,
    }
  }

  constructor(name: symbol | string, path = '/', protocol: string = PROTOCOL.LOCAL) {
    // TODO: add more validation
    this.#name = name
    this.#protocol = protocol
    this.#path = path

    if (this.#path !== '/' && !/^\/\w+\/$/.test(this.#path)) {
      throw new InvalidPathException(this.#path)
    }

    this.#uri = this.#protocol + ':/' + this.#path + this.#name.toString()
  }

  toString(): string {
    return this.uri
  }
}
