import { Middleware, Context, Route, Path, RoutePayload } from './types'

function isRoutePayload(x: unknown): x is RoutePayload<unknown, unknown> {
  return typeof x === 'object' && x !== null && 'path' in x && 'method' in x
}

export function isRoute(x: unknown): x is Route {
  return typeof x === 'object' && x !== null && 'path' in x && 'method' in x && 'middleware' in x
}

function matchPath(path: Path, route: Route): boolean {
  // todo: add more match rule
  return path === route.path
}

export class KuaiRouter {
  private routes: Route[] = []

  public get(path: Path, middleware: Middleware): this {
    this.routes.push({ path, method: 'GET', middleware })
    return this
  }

  public post(path: Path, middleware: Middleware): this {
    this.routes.push({ path, method: 'POST', middleware })
    return this
  }

  public put(path: Path, middleware: Middleware): this {
    this.routes.push({ path, method: 'PUT', middleware })
    return this
  }

  public delete(path: Path, middleware: Middleware): this {
    this.routes.push({ path, method: 'DELETE', middleware })
    return this
  }

  public patch(path: Path, middleware: Middleware): this {
    this.routes.push({ path, method: 'PATCH', middleware })
    return this
  }

  public head(path: Path, middleware: Middleware): this {
    this.routes.push({ path, method: 'HEAD', middleware })
    return this
  }

  public options(path: Path, middleware: Middleware): this {
    this.routes.push({ path, method: 'OPTIONS', middleware })
    return this
  }

  public middleware(): Middleware {
    return async (ctx: Context, next: () => Promise<void>) => {
      const payload = ctx.payload

      if (!isRoutePayload(payload)) {
        return next()
      }

      const route = this.routes.find((route) => route.method === payload.method && matchPath(payload.path, route))
      if (route) {
        return route.middleware(ctx, next)
      } else {
        return next()
      }
    }
  }
}
