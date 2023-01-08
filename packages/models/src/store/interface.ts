import type { Cell, HexString } from '@ckb-lumos/base'

export type OutPointString = string

type FieldSchema<T = unknown> =
  | T
  | {
      offset?: number
      length?: number
      schema: T
    }

export interface ScriptSchema<T = unknown> {
  codeHash?: FieldSchema<T>
  args?: FieldSchema<T>
}
export interface StorageSchema<T = unknown> {
  data?: FieldSchema<T>
  witness?: FieldSchema<T>
  lock?: ScriptSchema<T>
  type?: ScriptSchema<T>
}

type GetFieldStruct<T extends FieldSchema | unknown> = T extends { schema: unknown } ? T['schema'] : T

type IsKeysExist<T, K extends keyof T> = T & { _add: never } extends {
  [P in K]: T[P]
}
  ? true
  : false

type IsEmptyScriptSchemaNever<T extends ScriptSchema> = IsKeysExist<T, 'args'> extends true
  ? T
  : IsKeysExist<T, 'codeHash'> extends true
  ? T
  : never

type GetScriptStruct<T extends ScriptSchema> = IsEmptyScriptSchemaNever<{
  [P in keyof T as T[P] extends FieldSchema ? P : never]: GetFieldStruct<T[P]>
}>

export type OmitByValue<T, R = never> = {
  [P in keyof T as T[P] extends R ? never : P]: T[P]
}

type IfEmptyStorageSchemaNever<T extends StorageSchema> = IsKeysExist<T, 'data'> extends true
  ? T
  : IsKeysExist<T, 'witness'> extends true
  ? T
  : IsKeysExist<T, 'lock'> extends true
  ? T
  : IsKeysExist<T, 'type'> extends true
  ? T
  : never

export type GetFullStorageStruct<T extends StorageSchema> = {
  data: IsKeysExist<T, 'data'> extends true ? GetFieldStruct<T['data']> : never
  witness: IsKeysExist<T, 'witness'> extends true ? GetFieldStruct<T['witness']> : never
  lock: T extends { lock: infer Lock extends ScriptSchema } ? GetScriptStruct<Lock> : never
  type: T extends { type: infer Type extends ScriptSchema } ? GetScriptStruct<Type> : never
}

export type GetStorageStruct<T extends StorageSchema> = IfEmptyStorageSchemaNever<T> extends true
  ? never
  : OmitByValue<GetFullStorageStruct<T>>

type PickExist<T, K extends keyof T> = OmitByValue<{
  [P in K as P extends keyof T ? P : never]: T[P]
}>

type GetScriptOption<T extends ScriptSchema> = IsEmptyScriptSchemaNever<
  OmitByValue<{
    [P in keyof T]: T[P] extends { offset?: number; length?: number; schema: unknown }
      ? PickExist<T[P], 'offset' | 'length'>
      : true
  }>
>

export type GetStorageOption<T extends StorageSchema> = IfEmptyStorageSchemaNever<
  OmitByValue<{
    [P in keyof T]: P extends 'data'
      ? T extends { data: infer Option extends { offset?: number; length?: number; schema: unknown } }
        ? PickExist<Option, 'offset' | 'length'>
        : true
      : P extends 'witness'
      ? T extends { witness: infer Option extends { offset?: number; length?: number; schema: unknown } }
        ? PickExist<Option, 'offset' | 'length'>
        : true
      : P extends 'lock'
      ? T extends { lock: infer Lock extends ScriptSchema }
        ? GetScriptOption<Lock>
        : never
      : P extends 'type'
      ? T extends { type: infer Type extends ScriptSchema }
        ? GetScriptOption<Type>
        : never
      : never
  }>
>

export type GetOnChainStorage<T extends StorageSchema> = {
  data: IsKeysExist<T, 'data'> extends true ? string : never
  witness: IsKeysExist<T, 'witness'> extends true ? string : never
  lock: T extends { lock: infer Lock extends ScriptSchema }
    ? IsEmptyScriptSchemaNever<{ [P in keyof Lock]: string }>
    : never
  type: T extends { type: infer Type extends ScriptSchema }
    ? IsEmptyScriptSchemaNever<{ [P in keyof Type]: string }>
    : never
}

export type StorageLocation = 'data' | 'witness' | ['lock' | 'type', keyof ScriptSchema]

export type StorePath<K = StorageLocation> = K extends string[] ? [...K, ...string[]] : [K, ...string[]]

export type UpdateStorageValue = {
  witness: HexString
  cell: Cell
}

export type StoreMessage =
  | {
      type: 'remove_cell'
      value: OutPointString[]
    }
  | {
      type: 'update_cell'
      value: UpdateStorageValue
    }
