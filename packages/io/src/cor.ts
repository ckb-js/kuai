import { CoR as ICoR, Middleware, Context, JsonValue } from './types'
import compose from 'koa-compose'
import { isHttpError } from 'http-errors'
import { CustomError, KError } from '@ckb-js/kuai-core'

export class CoR<ContextT extends object = Record<string, never>> implements ICoR<ContextT> {
  private _middlewares: Middleware<ContextT>[] = []

  public use<NewContext = unknown>(plugin: Middleware<NewContext & ContextT>): CoR<NewContext & ContextT> {
    this._middlewares = [...this._middlewares, plugin] as Middleware<ContextT>[]
    return this
  }

  public async dispatch<Ok, Payload extends JsonValue>(payload: Payload): Promise<Ok | void> {
    return new Promise((resolve, rej) => {
      const ctx: Context<ContextT> = {
        payload,
        ok: (ok?: Ok) => (ok !== undefined ? resolve(ok) : resolve()),
        err: rej,
      } as Context<ContextT>

      compose(this._middlewares)(ctx)
    })
  }

  public static defaultCoR(): CoR {
    const cor = new CoR()
    cor.use(CoR.handleException())

    return cor
  }

  private static handleException(): Middleware {
    return async (context, next) => {
      try {
        await next()
      } catch (e) {
        if (e instanceof KError || isHttpError(e)) {
          context.err(e)
        } else {
          context.err(new CustomError('UNKNOWN ERROR', e as Error))
        }
      }
    }
  }
}
