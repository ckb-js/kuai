import { CoR as ICoR, Middleware, Context, JsonValue } from './types'
import compose from 'koa-compose'
import { isHttpError } from 'http-errors'
import { KuaiError } from '@ckb-js/kuai-common'

export const UNKNOWN = {
  UNKNOWN_ERROR: {
    code: 'UNKNOWN ERROR',
    message: 'code: %code%, UNKNOWN ERROR',
  },
}

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
        if (e instanceof KuaiError || isHttpError(e)) {
          context.err(e)
        } else {
          context.err(new KuaiError(UNKNOWN.UNKNOWN_ERROR, e as Error))
        }
      }
    }
  }
}
