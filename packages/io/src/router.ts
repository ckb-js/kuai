import { Middleware, Route, Path, RouterContext, RoutePayload, Method } from './types'
import type { Key } from 'path-to-regexp'
import { addLeadingSlash } from './helper'
import { pathToRegexp } from 'path-to-regexp'
import { NotFound } from 'http-errors'

function isRoutePayload(x: unknown): x is RoutePayload {
  return typeof x === 'object' && x !== null && 'path' in x && 'method' in x
}

export function isRoute(x: unknown): x is Route {
  return typeof x === 'object' && x !== null && 'path' in x && 'method' in x && 'middleware' in x
}

function matchPath(path: Path, route: Route): boolean {
  return route.regexp.test(addLeadingSlash(path))
}

function createRoute<
  Q extends Record<string, string> = Record<string, string>,
  P extends Record<string, string> = Record<string, string>,
  B extends object = object,
>(options: { path: Path; middleware: Middleware<RouterContext<Q, P, B>>; method: Method }): Route<Q, P, B> {
  const keys: Key[] = []
  const regexp = pathToRegexp(options.path, keys)

  return {
    path: options.path,
    method: options.method,
    middleware: async (ctx, next) => {
      await options.middleware(ctx, next)
    },
    regexp,
    paramKeys: keys,
  }
}

export class KuaiRouter {
  private routes: Route[] = []

  public get<
    Q extends Record<string, string> = Record<string, string>,
    P extends Record<string, string> = Record<string, string>,
  >(path: Path, middleware: Middleware<RouterContext<Q, P, Record<string, never>>>): this {
    this.routes.push(createRoute({ path, method: 'GET', middleware }) as Route)
    return this
  }

  public post<
    Q extends Record<string, string> = Record<string, string>,
    P extends Record<string, string> = Record<string, string>,
    B extends object = object,
  >(path: Path, middleware: Middleware<RouterContext<Q, P, B>>): this {
    this.routes.push(createRoute({ path, method: 'POST', middleware }) as Route)
    return this
  }

  public put<
    Q extends Record<string, string> = Record<string, string>,
    P extends Record<string, string> = Record<string, string>,
    B extends object = object,
  >(path: Path, middleware: Middleware<RouterContext<Q, P, B>>): this {
    this.routes.push(createRoute({ path, method: 'PUT', middleware }) as Route)
    return this
  }

  public delete<
    Q extends Record<string, string> = Record<string, string>,
    P extends Record<string, string> = Record<string, string>,
    B extends object = object,
  >(path: Path, middleware: Middleware<RouterContext<Q, P, B>>): this {
    this.routes.push(createRoute({ path, method: 'DELETE', middleware }) as Route)
    return this
  }

  public patch<
    Q extends Record<string, string> = Record<string, string>,
    P extends Record<string, string> = Record<string, string>,
    B extends object = object,
  >(path: Path, middleware: Middleware<RouterContext<Q, P, B>>): this {
    this.routes.push(createRoute({ path, method: 'PATCH', middleware }) as Route)
    return this
  }

  public head<
    Q extends Record<string, string> = Record<string, string>,
    P extends Record<string, string> = Record<string, string>,
    B extends object = object,
  >(path: Path, middleware: Middleware<RouterContext<Q, P, B>>): this {
    this.routes.push(createRoute({ path, method: 'HEAD', middleware }) as Route)
    return this
  }

  public options<
    Q extends Record<string, string> = Record<string, string>,
    P extends Record<string, string> = Record<string, string>,
    B extends object = object,
  >(path: Path, middleware: Middleware<RouterContext<Q, P, B>>): this {
    this.routes.push(createRoute({ path, method: 'OPTIONS', middleware }) as Route)
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
        const result = route.regexp.exec(addLeadingSlash(ctx.payload.path))

        if (result) {
          ctx.payload.params = route.paramKeys.reduce((a, b, index) => ({ ...a, [b.name]: result[index + 1] }), {})
        }

        return route.middleware(ctx, next)
      } else {
        throw new NotFound()
      }
    }
  }
}
