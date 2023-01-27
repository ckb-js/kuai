import { PATTERN_META_NAME } from './constants'

export interface PatternItem {
  field: string
  match:
    | {
        op: 'eq' | 'lt' | 'gt' | 'lte' | 'gte' | 'in'
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        value: any
      }
    | RegExp
}

export type PatternType =
  | {
      aggregate: 'OR' | 'AND'
      patterns: PatternItem[]
    }[]
  | PatternItem

export function Pattern(option?: PatternType): ClassDecorator {
  return function (target) {
    Reflect.defineMetadata(PATTERN_META_NAME, option, target)
    // TODO refister target to APP
  }
}
