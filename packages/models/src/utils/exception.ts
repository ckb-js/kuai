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

export class MessageQueueNotFoundException extends Error {
  constructor() {
    super(`message queue is not found`)
  }
}

export class ActorProviderException extends Error {
  constructor() {
    super(`ActorProvider is expected to be used with an Actor class`)
  }
}
