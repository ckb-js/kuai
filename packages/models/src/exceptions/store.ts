export class NonExistentException extends Error {
  constructor(path: string) {
    super(`The ${path} is not exist in state`)
  }
}

export class NonStorageInstanceException extends Error {
  constructor() {
    super(`Storage instance should be initialized`)
  }
}
