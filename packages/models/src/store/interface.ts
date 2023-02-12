import type { Cell, HexString } from '@ckb-lumos/base'

export type OutPointString = string
export type ByteLength = number

type FieldSchema<T = unknown> =
  | T
  | {
      offset?: ByteLength
      length?: ByteLength
      schema: T
    }

export interface StorageSchema<T = unknown> {
  data?: FieldSchema<T>
  witness?: FieldSchema<T>
  lockArgs?: FieldSchema<T>
  typeArgs?: FieldSchema<T>
}

type GetFieldStruct<T extends FieldSchema | unknown> = T extends { schema: unknown } ? T['schema'] : T

type IsKeysExist<T, K extends keyof T> = T & { _add: never } extends {
  [P in K]: T[P]
}
  ? true
  : false

export type OmitByValue<T, R = never> = {
  [P in keyof T as T[P] extends R ? never : P]: T[P]
}

type IfEmptyStorageSchema<T extends StorageSchema, R = never> = IsKeysExist<T, 'data'> extends true
  ? T
  : IsKeysExist<T, 'witness'> extends true
  ? T
  : IsKeysExist<T, 'lockArgs'> extends true
  ? T
  : IsKeysExist<T, 'typeArgs'> extends true
  ? T
  : R

export type GetFullStorageStruct<T extends StorageSchema> = {
  data: IsKeysExist<T, 'data'> extends true ? GetFieldStruct<T['data']> : never
  witness: IsKeysExist<T, 'witness'> extends true ? GetFieldStruct<T['witness']> : never
  lockArgs: IsKeysExist<T, 'lockArgs'> extends true ? GetFieldStruct<T['lockArgs']> : never
  typeArgs: IsKeysExist<T, 'typeArgs'> extends true ? GetFieldStruct<T['typeArgs']> : never
}

export type GetStorageStruct<T extends StorageSchema> = IfEmptyStorageSchema<T> extends true
  ? never
  : OmitByValue<GetFullStorageStruct<T>>

type PickExist<T, K extends keyof T> = OmitByValue<{
  [P in K as P extends keyof T ? P : never]: T[P]
}>

export type GetStorageOption<T extends StorageSchema> = IfEmptyStorageSchema<
  OmitByValue<{
    [P in keyof T]: P extends 'data'
      ? T extends { data: infer Option extends { offset?: ByteLength; length?: ByteLength; schema: unknown } }
        ? PickExist<Option, 'offset' | 'length'>
        : true
      : P extends 'witness'
      ? T extends { witness: infer Option extends { offset?: ByteLength; length?: ByteLength; schema: unknown } }
        ? PickExist<Option, 'offset' | 'length'>
        : true
      : P extends 'lockArgs'
      ? T extends { lockArgs: infer Option extends { offset?: ByteLength; length?: ByteLength; schema: unknown } }
        ? PickExist<Option, 'offset' | 'length'>
        : true
      : P extends 'typeArgs'
      ? T extends { typeArgs: infer Option extends { offset?: ByteLength; length?: ByteLength; schema: unknown } }
        ? PickExist<Option, 'offset' | 'length'>
        : true
      : never
  }>,
  void
>

export type GetOnChainStorage<T extends StorageSchema> = {
  data: IsKeysExist<T, 'data'> extends true ? string : never
  witness: IsKeysExist<T, 'witness'> extends true ? string : never
  lockArgs: IsKeysExist<T, 'lockArgs'> extends true ? string : never
  typeArgs: IsKeysExist<T, 'typeArgs'> extends true ? string : never
}

export type StorageLocation = keyof StorageSchema

export type StorePath = [StorageLocation, ...string[]]

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
      type: 'update_cells'
      value: UpdateStorageValue[]
    }
