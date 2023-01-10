import { CoR as ICoR, Middleware, Context, DefaultContext } from './types'
import compose from 'koa-compose'

export class CoR<ContextT = DefaultContext> implements ICoR {
  private _middlewares: Middleware<ContextT>[] = []

  public use<NewContext = unknown>(plugin: Middleware<NewContext & ContextT>): CoR<NewContext & ContextT> {
    this._middlewares = [...this._middlewares, plugin] as Middleware<ContextT>[]
    return this
  }

  public async dispatch<Payload extends Context<DefaultContext>['payload'], Ok>(payload: Payload): Promise<Ok | void> {
    return new Promise((resolve, rej) => {
      const ctx: Context<ContextT> = {
        payload,
        ok: (ok?: Ok) => (ok !== undefined ? resolve(ok) : resolve()),
        err: rej,
      } as Context<ContextT>

      compose(this._middlewares)(ctx)
    })
  }
}
