import { Middleware, Route, Path, RouterContext, RoutePayload, Method } from './types'
import type { Key } from 'path-to-regexp'
import { pathToRegexp } from 'path-to-regexp'
import { NotFound } from 'http-errors'
import { KUAI_ROUTE_METADATA_METHOD, KUAI_ROUTE_METADATA_PATH } from './metadata'
import 'reflect-metadata'

function isRoutePayload(x: unknown): x is RoutePayload {
  return typeof x === 'object' && x !== null && 'path' in x && 'method' in x
}

function matchPath(path: Path, route: Route): boolean {
  return route.regexp.test(path)
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
      try {
        await options.middleware(ctx, next)
      } catch (e) {
        ctx.err(e)
      }
    },
    regexp,
    paramKeys: keys,
  }
}

const getMethods = (obj: object): string[] => {
  const properties = new Set<string>()
  let currentObj = obj
  do {
    Object.getOwnPropertyNames(currentObj).map((item) => properties.add(item))
  } while ((currentObj = Object.getPrototypeOf(currentObj)))
  return [...properties.keys()].filter((item) => typeof obj[item as keyof typeof obj] === 'function')
}

export class BaseController {
  getRoutes(): Route[] {
    const methods = getMethods(this)
    const routeMethodNames = methods.filter((method) =>
      Boolean(Reflect.getMetadata(KUAI_ROUTE_METADATA_METHOD, this, method)),
    )

    return routeMethodNames.map((key) =>
      createRoute({
        path: Reflect.getMetadata(KUAI_ROUTE_METADATA_PATH, this, key),
        method: Reflect.getMetadata(KUAI_ROUTE_METADATA_METHOD, this, key),
        middleware: this[key as keyof this] as Middleware,
      }),
    )
  }

  public middleware(): Middleware<RouterContext> {
    return async (ctx, next) => {
      const payload = ctx.payload

      if (!isRoutePayload(payload)) {
        return next()
      }

      const route = this.getRoutes().find((route) => route.method === payload.method && matchPath(payload.path, route))
      if (route) {
        const result = route.regexp.exec(ctx.payload.path)

        if (result) {
          ctx.payload.params = route.paramKeys.reduce((a, b, index) => ({ ...a, [b.name]: result[index + 1] }), {})
        }

        return route.middleware(ctx, next)
      } else {
        ctx.err(new NotFound())
        return next()
      }
    }
  }
}
