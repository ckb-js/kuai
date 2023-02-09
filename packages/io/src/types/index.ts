import type { CKBComponents } from '@ckb-lumos/rpc/lib/types/api'
import type { Key } from 'path-to-regexp'
import type { Script } from '@ckb-lumos/base'

export interface Listener<T> {
  on(listen: (obj: T) => void): void
}

export type JsonValue = null | number | string | { [key: string]: JsonValue } | JsonValue[]

type Next = () => Awaited<void>

export type DefaultContext = object

export type Context<CustomT extends DefaultContext = DefaultContext> = {
  payload: JsonValue
  ok(): void
  ok<OK>(x: OK): void
  err(): void
  err<Err>(x: Err): void
} & CustomT

export type Middleware<CustomT extends DefaultContext = DefaultContext> = (
  context: Context<CustomT>,
  next: Next,
) => ReturnType<Next>

// `CoR` (Chain of Responsibility), abbr for chain of responsibility
// a module that strings middleware together in order
export interface CoR<ContextT extends DefaultContext = Record<string, never>> {
  use<NewContextT = unknown>(plugin: Middleware<NewContextT & ContextT>): CoR<NewContextT & ContextT>

  dispatch<Ok>(payload: JsonValue): Promise<Ok | void>
}

export interface Listener<T> {
  on(listen: (obj: T) => void): { unsubscribe: () => void }
}

export interface ChainSource {
  getTipBlockNumber: () => Promise<CKBComponents.BlockNumber>
  getTipHeader: () => Promise<CKBComponents.BlockHeader>
  getCurrentEpoch: () => Promise<CKBComponents.Epoch>
  getBlock: (blockNumber: string) => Promise<CKBComponents.Block | undefined>
  getAllLiveCellsWithWitness: (
    lockScript: Script,
    typeScript?: Script,
  ) => Promise<(CKBComponents.IndexerCell & { witness: CKBComponents.Witness })[]>
}

export type Path = string
export type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export type RoutePayload<
  Query extends Record<string, string> = Record<string, string>,
  Params extends Record<string, string> = Record<string, string>,
  Body extends object = object,
> = {
  query?: Query
  path: Path
  method: Method
} & ([Params] extends [never] ? Record<string, never> : { params: Params }) &
  ([Body] extends [never] ? Record<string, never> : { body: Body })

export interface RouterContext<
  Query extends Record<string, string> = Record<string, string>,
  Params extends Record<string, string> = Record<string, string>,
  Body extends object = object,
> {
  payload: RoutePayload<Query, Params, Body>
}

export type RouterExtendContext<
  Query extends Record<string, string> = Record<string, string>,
  Params extends Record<string, string> = Record<string, string>,
  Body extends object = object,
> = Context<RouterContext<Query, Params, Body>>

export interface Route<
  Query extends Record<string, string> = Record<string, string>,
  Params extends Record<string, string> = Record<string, string>,
  Body extends object = object,
> {
  path: Path
  method: Method
  middleware: Middleware<RouterContext<Query, Params, Body>>
  paramKeys: Key[]
  regexp: RegExp
}
