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

export class UnexpectedParamsException extends Error {
  constructor(params: string) {
    super(`Unexpected params with ${params} when calling deserialize`)
  }
}

export class NoSchemaException extends Error {
  constructor(type: string) {
    super(`No schema setting with ${type}`)
  }
}

export class NonExistentCellException extends Error {
  constructor(outPoint: string) {
    super(`${outPoint} cell is not exist in store`)
  }
}

export class UnmatchLengthException extends Error {
  constructor(type: string, actual: number, expected: number) {
    super(`Actual length is ${actual}, but expected length is ${expected} in ${type}`)
  }
}

export class UnknownMoleculeTypeException extends Error {
  constructor(type: string) {
    super(`Unexpected molecule type with ${type} when create codec`)
  }
}

export class NoCodecForMolecueException extends Error {
  constructor() {
    super(`No codec for serialize or deserialize`)
  }
}

export class UnionShouldOnlyOneKeyException extends Error {
  constructor() {
    super(`Molecule union type should only have one key for pack`)
  }
}

export class SectionStoreCannotCloneException extends Error {
  constructor() {
    super(`A section store can not clone a full store`)
  }
}

export class NoCellToUseException extends Error {
  constructor() {
    super(`There are no live cells to use`)
  }
}

export class CantSetValueInSimpleType extends Error {
  constructor() {
    super(`Can not set value in a simple type`)
  }
}
