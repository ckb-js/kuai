import { Context, HttpError, Next } from 'koa'

export function exceptionHandle() {
  return async (ctx: Context, next: Next) => {
    try {
      await next()
    } catch (err) {
      if (err instanceof HttpError) {
        ctx.body = { message: err.message }
      } else if (err instanceof BizError) {
        ctx.status = 400
        ctx.body = { message: err.message }
      } else {
        ctx.status = 500
        ctx.body = { message: 'Internal server error' }
      }
    }
  }
}

export class BizError extends Error {}
