import { CoR as ICoR, Middleware, Context, JsonValue } from './types'
import compose from 'koa-compose'

export class CoR<ContextT extends object = Record<string, never>> implements ICoR<ContextT> {
  private _middlewares: Middleware<ContextT>[] = []

  public use<NewContext = unknown>(plugin: Middleware<NewContext & ContextT>): CoR<NewContext & ContextT> {
    this._middlewares = [...this._middlewares, plugin] as Middleware<ContextT>[]
    return this
  }

  public async dispatch<Ok>(payload: JsonValue): Promise<Ok | void> {
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
