import { CoR as ICoR, Middleware, Context, JsonValue } from './types'
import compose from 'koa-compose'

export class CoR implements ICoR {
  private _middlewares: Middleware[] = []

  public use(plugin: Middleware): CoR {
    this._middlewares = [...this._middlewares, plugin]
    return this
  }

  public async dispatch<Payload extends JsonValue, Ok>(payload: Payload): Promise<Ok | void> {
    return new Promise((resolve, rej) => {
      const ctx: Context = {
        payload,
        ok: (ok?: Ok) => (ok !== undefined ? resolve(ok) : resolve()),
        err: rej,
      }

      compose(this._middlewares)(ctx)
    })
  }
}
