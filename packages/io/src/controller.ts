import { Middleware, Route, Path, RouterContext, RoutePayload, Method } from './types'
import { type Key, pathToRegexp } from 'path-to-regexp'
import { NotFound } from 'http-errors'
import { addLeadingSlash, concatPaths, matchParams } from './helper'
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
  #routes: Route[] = this.getRoutes()

  createMiddleware(key: string | symbol): Middleware<RouterContext> {
    return (ctx) => {
      const argsMetadata: Record<number, RouteParamMetadata> =
        Reflect.getMetadata(KUAI_ROUTE_ARGS_METADATA, this, key) || {}

      const args = Object.values(argsMetadata)
        .map((arg) => {
          const value = (() => {
            let typeValue
            switch (arg.paramtype) {
              case RouteParamtypes.BODY:
                typeValue = ctx.payload.body
                break
              case RouteParamtypes.HEADERS:
                typeValue = ctx.payload.header
                break
              case RouteParamtypes.PARAM:
                typeValue = ctx.payload.params
                break
              case RouteParamtypes.QUERY:
                typeValue = ctx.payload.query
                break
              default:
                typeValue = undefined
                break
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (arg.data !== undefined) return (typeValue as any)?.[arg.data]
            return typeValue
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

      const route = this.#routes.find((route) => route.method === payload.method && matchPath(payload.path, route))
      if (route && route.middleware) {
        ctx.payload.params = matchParams({ path: ctx.payload.path, route })

        return route.middleware(ctx, next)
      } else {
        ctx.err(new NotFound())
        return next()
      }
    }
  }
}
