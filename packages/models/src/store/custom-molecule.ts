import { molecule, bytes, UnpackResult, PackParam } from '@ckb-lumos/codec'
import { BytesCodec } from '@ckb-lumos/codec/lib/base'
import { UnionShouldOnlyOneKeyException } from '../exceptions'

export const UTF8String = molecule.byteVecOf<string>({
  pack: (str) => Uint8Array.from(Buffer.from(str, 'utf8')),
  unpack: (buf) => Buffer.from(bytes.bytify(buf)).toString('utf8'),
})

export type UnionCodec<T extends Record<string, BytesCodec>> = BytesCodec<
  { [key in keyof T]: { type: key; value: UnpackResult<T[key]> } }[keyof T],
  { [key in keyof T]: { type: key; value: PackParam<T[key]> } }[keyof T]
>

type GetRecordKeys<T extends Record<string, unknown>> = keyof T
type OneOfRecordFromK<T extends Record<string, unknown>, K> = K extends GetRecordKeys<T>
  ? {
      [P in keyof T as P extends K ? K : never]: T[P]
    } & Partial<{
      [P in keyof T as P extends K ? never : P]: never
    }>
  : never

export type OneOfRecord<T extends Record<string, unknown>> = OneOfRecordFromK<T, GetRecordKeys<T>>

type WrapUnionCodec<T extends Record<string, BytesCodec>> = BytesCodec<
  OneOfRecord<{ [key in keyof T]: UnpackResult<T[key]> }>,
  OneOfRecord<{ [key in keyof T]: PackParam<T[key]> }>
>
export function wrapUnion<T extends Record<string, BytesCodec>>(itemCodec: T, fields: (keyof T)[]): WrapUnionCodec<T> {
  const unionPack = molecule.union(itemCodec, fields)
  return {
    pack(packable) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const validKeys = Object.keys(packable).filter((v) => (packable as any)[v] !== undefined)
      if (validKeys.length !== 1) throw new UnionShouldOnlyOneKeyException()
      return unionPack.pack({
        type: validKeys[0],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: (packable as any)[validKeys[0]],
      })
    },
    unpack(unpackable) {
      const res = unionPack.unpack(unpackable)
      return {
        [res.type]: res.value,
      } as UnpackResult<WrapUnionCodec<T>>
    },
  }
}
