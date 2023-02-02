import KoaRouter from 'koa-router'
import * as Koa from 'koa'
import { CoR } from './cor'
import type { JsonValue } from './types'

declare module 'koa' {
  interface Request extends Koa.BaseRequest {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: any
  }
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
      ctx.body = await this.cor.dispatch({
        method: ctx.method,
        path: ctx.path,
        query: ctx.query as JsonValue,
        body: ctx.request.body,
      })
      await next()
    }
  }
}
