import { CellPattern, SchemaPattern } from '../utils'
import { UpdateStorageValue } from './interface'

export function cellPatternMatch(pattern: CellPattern, value: UpdateStorageValue) {
  if (Array.isArray(pattern)) {
    return pattern.reduce((result, func) => result && func(value, result), true)
  }
  return pattern(value, true)
}

export function schemaPatternMatch(pattern: SchemaPattern, value: unknown) {
  if (Array.isArray(pattern)) {
    return pattern.reduce((result, func) => result && func(value, result), true)
  }
  return pattern(value, true)
}
