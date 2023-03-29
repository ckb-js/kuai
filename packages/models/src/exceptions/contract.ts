export class ParamsMissException extends Error {
  constructor() {
    super(`Remote call should deliver method name`)
  }
}
