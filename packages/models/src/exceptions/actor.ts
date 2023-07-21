export class ActorRefEmptyException extends Error {
  constructor() {
    super(`The actor reference is empty.`)
  }
}
