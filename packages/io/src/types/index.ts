export interface Listener<T> {
  on(listen: (obj: T) => void): void
}

export type Middleware = (ctx: Context, next: () => Promise<void>) => Promise<void>

export interface Context {
  payload: JsonValue

  ok(): void

  ok<OK>(x: OK): void

  err(): void

  err<Err>(x: Err): void
}

export type JsonValue = null | number | string | { [key: string]: JsonValue } | JsonValue[]

// `CoR` (Chain of Responsibility), abbr for chain of responsibility
// a module that strings middleware together in order
export interface CoR {
  use(plugin: Middleware): void

  dispatch<Payload extends JsonValue, Ok>(payload: Payload): Promise<Ok | void>
}
