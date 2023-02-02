import { Middleware, Route, Path, RouterContext, RoutePayload, Method } from './types'
import type { Key } from 'path-to-regexp'
import { pathToRegexp } from 'path-to-regexp'

function isRoutePayload(x: unknown): x is RoutePayload {
  return typeof x === 'object' && x !== null && 'path' in x && 'method' in x
}

export function isRoute(x: unknown): x is Route {
  return typeof x === 'object' && x !== null && 'path' in x && 'method' in x && 'middleware' in x
}

function matchPath(path: Path, route: Route): boolean {
  return route.regexp.test(path)
}

function createRoute(options: { path: Path; middleware: Middleware<RouterContext>; method: Method }): Route {
  const { path, middleware, method } = options
  const keys: Key[] = []
  const regexp = pathToRegexp(path, keys)

  return {
    path,
    method,
    middleware,
    regexp,
    paramKeys: keys,
  }
}

export class KuaiRouter {
  private routes: Route[] = []

  public get(path: Path, middleware: Middleware<RouterContext>): this {
    this.routes.push(createRoute({ path, method: 'GET', middleware }))
    return this
  }

  public post(path: Path, middleware: Middleware<RouterContext>): this {
    this.routes.push(createRoute({ path, method: 'POST', middleware }))
    return this
  }

  public put(path: Path, middleware: Middleware<RouterContext>): this {
    this.routes.push(createRoute({ path, method: 'PUT', middleware }))
    return this
  }

  public delete(path: Path, middleware: Middleware<RouterContext>): this {
    this.routes.push(createRoute({ path, method: 'DELETE', middleware }))
    return this
  }

  public patch(path: Path, middleware: Middleware<RouterContext>): this {
    this.routes.push(createRoute({ path, method: 'PATCH', middleware }))
    return this
  }

  public head(path: Path, middleware: Middleware<RouterContext>): this {
    this.routes.push(createRoute({ path, method: 'HEAD', middleware }))
    return this
  }

  public options(path: Path, middleware: Middleware<RouterContext>): this {
    this.routes.push(createRoute({ path, method: 'OPTIONS', middleware }))
    return this
  }

  public middleware(): Middleware<RouterContext> {
    return async (ctx, next) => {
      const payload = ctx.payload

      if (!isRoutePayload(payload)) {
        return next()
      }

      const route = this.routes.find((route) => route.method === payload.method && matchPath(payload.path, route))
      if (route) {
        const result = route.regexp.exec(ctx.payload.path)

        if (result) {
          ctx.payload.params = route.paramKeys.reduce((a, b, index) => ({ ...a, [b.name]: result[index + 1] }), {})
        }

        return route.middleware(ctx, next)
      } else {
        return next()
      }
    }
  }
}
