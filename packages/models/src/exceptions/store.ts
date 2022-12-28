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

export class UnExpectedParamsException extends Error {
  constructor(params: string) {
    super(`Unexpected params with ${params} when calling deserialize`)
  }
}

export class UnexpectedMoleculeTypeException extends Error {
  constructor(type: string) {
    super(`Unexpected molecule type with ${type} when create codec`)
  }
}

export class NoCodecForMolecueException extends Error {
  constructor() {
    super(`No codec for serialize or deserialize`)
  }
}
