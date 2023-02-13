import KoaRouter from 'koa-router'
import { isHttpError } from 'http-errors'
import * as Koa from 'koa'
import { CoR } from './cor'
import type { JsonValue } from './types'

declare module 'koa' {
  interface Request extends Koa.BaseRequest {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any
  }
}

interface NestedResult<Body extends object = object> {
  _status: number
  _body: Body
}

function isNestedResult<Body extends object = object>(obj: unknown): obj is NestedResult<Body> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (obj as any)._body !== undefined &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (obj as any)._status !== undefined
  )
}

export class KoaRouterAdapter extends KoaRouter {
  constructor(private readonly cor: CoR) {
    super()
  }

  middleware(): KoaRouter.IMiddleware {
    return this.routes()
  }

  routes(): KoaRouter.IMiddleware {
    return async (ctx, next) => {
      try {
        const result = await this.cor.dispatch({
          method: ctx.method,
          path: ctx.path,
          query: ctx.query as JsonValue,
          header: ctx.request.header as JsonValue,
          body: ctx.request.body,
        })

        if (isNestedResult(result)) {
          ctx.body = result._body
          ctx.status = result._status
        } else {
          ctx.body = result
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          ctx.body = e.message
        }

        if (isHttpError(e)) {
          ctx.status = e.status || 500
        }
      }

      await next()
    }
  }
}
