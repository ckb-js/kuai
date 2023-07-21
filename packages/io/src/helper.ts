import { Key, pathToRegexp } from 'path-to-regexp'
import { Method, Middleware, Path, Route, RouterContext } from './types'

export const addLeadingSlash = (path?: string): string =>
  path && typeof path === 'string' ? (path.charAt(0) !== '/' ? '/' + path : path) : ''

export const concatPaths = (a: string, b: string) =>
  addLeadingSlash(stripEndSlash(a)) + addLeadingSlash(stripEndSlash(b))

export const stripEndSlash = (path: string) => (path[path.length - 1] === '/' ? path.slice(0, path.length - 1) : path)

export function matchPath(path: Path, route: Route): boolean {
  return route.regexp.test(addLeadingSlash(path))
}

export function createRoute<
  Q extends Record<string, string> = Record<string, string>,
  P extends Record<string, string> = Record<string, string>,
  B extends object = object,
>(options: { path: Path; middleware?: Middleware<RouterContext>; method?: Method }): Route<Q, P, B> {
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

export function matchParams(options: { path: Path; route: Route }): Record<string, string> {
  const result = options.route.regexp.exec(addLeadingSlash(options.path))
  if (!result) {
    return {}
  }

  return options.route.paramKeys.reduce((a, b, index) => ({ ...a, [b.name]: result[index + 1] }), {})
}
