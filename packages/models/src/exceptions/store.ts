export class NonExistentException extends Error {
  constructor(path: string) {
    super(`The ${path} does not exist in state`)
  }
}

export class NonStorageInstanceException extends Error {
  constructor() {
    super(`Storage instance should be initialized`)
  }
}

export class UnexpectedTypeException extends Error {
  constructor(type: string) {
    super(`Unexpected type: ${type} in storage`)
  }
}

export class UnexpectedMarkException extends Error {
  constructor(mark: string) {
    super(`Unexpected mark: ${mark} in storage`)
  }
}

export class NoExpectedDataException extends Error {
  constructor() {
    super(`Storage does not include data or witness`)
  }
}
