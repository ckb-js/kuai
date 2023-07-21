/**
 * @module src/exception
 * @description
 * This module defines the exception handler for the application.
 * It catches all exceptions and returns the error message to the client.
 */

import { Context, Next } from 'koa'
import { MvpResponse } from './response'
import { isHttpError } from 'http-errors'

export function handleException() {
  return async (ctx: Context, next: Next) => {
    try {
      await next()
    } catch (err) {
      if (isHttpError(err)) {
        ctx.err(err)
      } else if (err instanceof MvpError) {
        ctx.ok(MvpResponse.err(err.message, err.code))
      } else {
        ctx.status = 500
        ctx.err(new Error('Internal server error'))
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
