import { isPlainObject, isArray, camelCase, kebabCase, snakeCase } from 'lodash'

export function isNestedObject(obj: object): boolean {
  return isPlainObject(obj) || isArray(obj)
}

export function caseful<T extends object>(obj: T, caser: (str: string) => string): object {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [caser(key)]: isNestedObject(value) ? caseful(value, caser) : value,
    }),
    {},
  )
}

export function camelCaseKeys<T extends object>(obj: T): object {
  return caseful(obj, camelCase)
}

export function kebabCaseKeys<T extends object>(obj: T): object {
  return caseful(obj, kebabCase)
}

export function snakeCaseKeys<T extends object>(obj: T): object {
  return caseful(obj, snakeCase)
}
