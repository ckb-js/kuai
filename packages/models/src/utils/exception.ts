import { KError } from '@ckb-js/kuai-core'

export class InvalidPathException extends KError {
  constructor(path: string) {
    super(`${path} is invalid`)
  }
}
export class InvalidActorURIException extends KError {
  constructor(uri: unknown) {
    super(`uri ${uri} is invalid`)
  }
}

export class DuplicatedActorException extends KError {
  constructor(uri: string) {
    super(`actor ${uri} has been bound`)
  }
}

export class SendMailException extends KError {
  constructor(from: string, to: string) {
    super(`failed to send mail from ${from} to ${to}`)
  }
}

export class ActorProviderException extends KError {
  constructor() {
    super(`ActorProvider is expected to be used with an Actor class`)
  }
}

export class PayloadMissingInMessageException extends KError {
  constructor() {
    super(`Payload is missing in message`)
  }
}
