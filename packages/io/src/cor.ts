import { CoR as ICoR, Middleware, Context, JsonValue } from './types'
import compose from 'koa-compose'
import { NotFound } from 'http-errors'

const notFoundMiddleware: Middleware = async (ctx, next) => {
  ctx.err(new NotFound())
  return next()
}

export class CoR<ContextT extends object = Record<string, never>> implements ICoR<ContextT> {
  private _exceptionHandler: Middleware<ContextT> = CoR.handleException()
  private _middlewares: Middleware<ContextT>[] = []

  public use<NewContext = unknown>(plugin: Middleware<NewContext & ContextT>): CoR<NewContext & ContextT> {
    this._middlewares = [...this._middlewares, plugin] as Middleware<ContextT>[]
    return this
  }

  public useExceptionHandler(plugin: unknown): CoR<ContextT> {
    this._exceptionHandler = plugin as Middleware<ContextT>
    return this
  }

  public async dispatch<Ok, Payload extends JsonValue>(payload: Payload): Promise<Ok | void> {
    return new Promise((resolve, rej) => {
      const ctx: Context<ContextT> = {
        payload,
        ok: (ok?: Ok) => (ok !== undefined ? resolve(ok) : resolve()),
        err: rej,
      } as Context<ContextT>

      compose([this._exceptionHandler, ...this._middlewares, notFoundMiddleware])(ctx)
    })
  }

  private static handleException(): Middleware {
    return async (context, next) => {
      try {
        await next()
      } catch (e) {
        context.err(e)
      }
    }
  }
}
