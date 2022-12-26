import KoaRouter from 'koa-router'
import { CoR } from './cor'

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
        params: ctx.params,
        // todo: support body & query
        // query: ctx.query,
        // body: ctx.request.body,
      })
      await next()
    }
  }
}
