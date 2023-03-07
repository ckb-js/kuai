import { Context, HttpError, Next } from 'koa'
import { MvpResponse } from './response'

export function handleException() {
  return async (ctx: Context, next: Next) => {
    try {
      await next()
    } catch (err) {
      if (err instanceof HttpError) {
        ctx.body = { message: err.message }
      } else if (err instanceof MvpError) {
        ctx.status = 200
        ctx.body = MvpResponse.err(err.message, err.code)
      } else {
        ctx.status = 500
        ctx.body = { message: 'Internal server error' }
      }
    }
  }
}

export class MvpError extends Error {
  code: string

  constructor(message: string, errCode: string) {
    super(message)
    this.code = errCode
  }
}
