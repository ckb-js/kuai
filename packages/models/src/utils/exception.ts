export class InvalidPathException extends Error {
  constructor(path: string) {
    super(`${path} is invalid`)
  }
}
export class InvalidActorURIException extends Error {
  constructor(uri: unknown) {
    super(`uri ${uri} is invalid`)
  }
}

export class DuplicatedActorException extends Error {
  constructor(uri: string) {
    super(`actor ${uri} has been bound`)
  }
}

export class SendMailException extends Error {
  constructor(from: string, to: string) {
    super(`failed to send mail from ${from} to ${to}`)
  }
}

export class ActorProviderException extends Error {
  constructor() {
    super(`ActorProvider is expected to be used with an Actor class`)
  }
}

export class PayloadMissingInMessageException extends Error {
  constructor() {
    super(`Payload is missing in message`)
  }
}
