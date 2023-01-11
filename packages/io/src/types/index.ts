import type { CKBComponents } from '@ckb-lumos/rpc/lib/types/api'
import { Key } from 'path-to-regexp'
export interface Listener<T> {
  on(listen: (obj: T) => void): void
}

export interface DefaultContext {
  /**
   * Custom properties.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export type JsonValue = null | number | string | { [key: string]: JsonValue } | JsonValue[]

type Next = () => Awaited<void>

export type Context<CustomT = DefaultContext> = {
  payload: JsonValue
  ok(): void
  ok<OK>(x: OK): void
  err(): void
  err<Err>(x: Err): void
} & CustomT

export type Middleware<CustomT = DefaultContext> = (context: Context<CustomT>, next: Next) => ReturnType<Next>

// `CoR` (Chain of Responsibility), abbr for chain of responsibility
// a module that strings middleware together in order
export interface CoR<ContextT = DefaultContext> {
  use<NewContextT = unknown>(plugin: Middleware<NewContextT & ContextT>): CoR<NewContextT & ContextT>

  dispatch<Payload extends JsonValue, Ok>(payload: Payload): Promise<Ok | void>
}

export interface Listener<T> {
  on(listen: (obj: T) => void): { unsubscribe: () => void }
}

export interface ChainSource {
  getTipBlockNumber: () => Promise<CKBComponents.BlockNumber>
  getTipHeader: () => Promise<CKBComponents.BlockHeader>
  getCurrentEpoch: () => Promise<CKBComponents.Epoch>
}

export type Path = string
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export type RoutePayload<Query = Record<string, string>, Params = Record<string, string>, Body = unknown> = {
  query: Query
  body: Body
  params: Params
  path: Path
  method: Method
}

export interface RouterContext {
  payload: RoutePayload
}

export interface Route {
  path: Path
  method: Method
  middleware: Middleware<RouterContext>
  paramKeys: Key[]
  regexp: RegExp
}
