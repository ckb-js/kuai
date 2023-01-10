import KoaRouter from 'koa-router'
import { CoR } from './cor'
import { JsonValue } from './types'

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: (ctx.request as any)?.body || undefined,
      })
      await next()
    }
  }
}
