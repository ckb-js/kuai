import type { CKBComponents } from '@ckb-lumos/rpc/lib/types/api'

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

export interface Listener<T> {
  on(listen: (obj: T) => void): { unsubscribe: () => void }
}

export interface ChainSource {
  getTipBlockNumber: () => Promise<CKBComponents.BlockNumber>
  getTipHeader: () => Promise<CKBComponents.BlockHeader>
  getCurrentEpoch: () => Promise<CKBComponents.Epoch>
  getBlock: (blockNumber: string) => Promise<CKBComponents.Block>
}

export type Path = string
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export type RoutePayload<Body, Params> = {
  body: Body
  params: Params
  path: Path
  method: Method
}

export interface Route {
  path: Path
  method: Method
  middleware: Middleware
}
