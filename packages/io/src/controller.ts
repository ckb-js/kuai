import { Middleware, Route, Path, RouterContext, RoutePayload, Method } from './types'
import type { Key } from 'path-to-regexp'
import { pathToRegexp } from 'path-to-regexp'
import { NotFound } from 'http-errors'
import { addLeadingSlash, concatPaths } from './helper'
import {
  KUAI_ROUTE_METADATA_METHOD,
  KUAI_ROUTE_METADATA_PATH,
  KUAI_ROUTE_ARGS_METADATA,
  KUAI_ROUTE_CONTROLLER_PATH,
  RouteParamtypes,
} from './metadata'
import { RouteParamMetadata } from './decorator'
import 'reflect-metadata'

function isRoutePayload(x: unknown): x is RoutePayload {
  return typeof x === 'object' && x !== null && 'path' in x && 'method' in x
}

function matchPath(path: Path, route: Route): boolean {
  return route.regexp.test(addLeadingSlash(path))
}

function createRoute<
  Q extends Record<string, string> = Record<string, string>,
  P extends Record<string, string> = Record<string, string>,
  B extends object = object,
>(options: { path: Path; middleware: Middleware<RouterContext>; method: Method }): Route<Q, P, B> {
  const keys: Key[] = []
  const regexp = pathToRegexp(options.path, keys)

  return {
    path: options.path,
    method: options.method,
    middleware: options.middleware,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class BaseController {
  _routes: Route[] = this.getRoutes()

  createMiddleware(key: string | symbol): Middleware<RouterContext> {
    return (ctx) => {
      const argsMetadata: Record<number, RouteParamMetadata> =
        Reflect.getMetadata(KUAI_ROUTE_ARGS_METADATA, this, key) || {}

      const args = Object.values(argsMetadata)
        .map((arg) => {
          const value = (() => {
            if (arg.paramtype === RouteParamtypes.BODY) {
              if (arg.data === undefined) {
                return ctx.payload.body
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              return (ctx.payload.body as any)[arg.data]
            }

            if (arg.paramtype === RouteParamtypes.HEADERS) {
              if (arg.data === undefined) {
                return ctx.payload.header
              }
              return ctx.payload.header[arg.data]
            }

            if (arg.paramtype === RouteParamtypes.PARAM) {
              if (arg.data === undefined) {
                return ctx.payload.params
              }
              return ctx.payload.params[arg.data]
            }

            if (arg.paramtype === RouteParamtypes.QUERY) {
              if (ctx.payload.query === undefined) {
                return undefined
              }
              if (arg.data === undefined) {
                return ctx.payload.query
              }
              return ctx.payload.query[arg.data]
            }

            return undefined
          })()

          return {
            index: arg.index,
            value: value,
          }
        })
        .sort((a, b) => a.index - b.index)
        .map((metadata) => metadata.value)

      try {
        // eslint-disable-next-line @typescript-eslint/ban-types
        const result = (this[key as keyof this] as Function)(...args)
        ctx.ok(result)
      } catch (e) {
        ctx.err(e)
      }
    }
  }

  getRoutes(): Route[] {
    const methods = getMethods(this)
    const routeMethodNames = methods.filter((method) =>
      Boolean(Reflect.getMetadata(KUAI_ROUTE_METADATA_METHOD, this, method)),
    )

    return routeMethodNames.map((key) =>
      createRoute({
        path: concatPaths(
          Reflect.getMetadata(KUAI_ROUTE_CONTROLLER_PATH, Object.getPrototypeOf(this).constructor) || '/',
          Reflect.getMetadata(KUAI_ROUTE_METADATA_PATH, this, key),
        ),
        method: Reflect.getMetadata(KUAI_ROUTE_METADATA_METHOD, this, key),
        middleware: this.createMiddleware(key),
      }),
    )
  }

  public middleware(): Middleware<RouterContext> {
    return async (ctx, next) => {
      const payload = ctx.payload

      if (!isRoutePayload(payload)) {
        return next()
      }

      const route = this._routes.find((route) => route.method === payload.method && matchPath(payload.path, route))
      if (route) {
        const result = route.regexp.exec(addLeadingSlash(ctx.payload.path))

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
