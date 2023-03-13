import { molecule, number } from '@ckb-lumos/codec'
import { describe, expect, it } from '@jest/globals'
import { UnionShouldOnlyOneKeyException } from '../../src/exceptions'
import { UTF8String, wrapUnion } from '../../src/store/custom-molecule'

describe('test customer-molecule functions', () => {
  it('test UTF8 string', () => {
    const input = 'abcd0123-=~'
    expect(UTF8String.unpack(UTF8String.pack(input))).toBe(input)
  })

  describe('test wrapUnion', () => {
    it('wrapUnion success', () => {
      const codec = wrapUnion({ a: UTF8String, b: number.Uint8 }, ['a', 'b'])
      const moleculeFunc = molecule.union({ a: UTF8String, b: number.Uint8 }, ['a', 'b'])
      const input = { a: 'a' }
      expect(codec.pack(input)).toStrictEqual(moleculeFunc.pack({ type: 'a', value: 'a' }))
    })
    it('wrapUnion pack and unpack', () => {
      const codec = wrapUnion({ a: UTF8String, b: number.Uint8 }, ['a', 'b'])
      const input = { a: 'a' }
      expect(codec.unpack(codec.pack(input))).toStrictEqual(input)
    })
    it('wrapUnion with exception', () => {
      const codec = wrapUnion({ a: UTF8String, b: number.Uint8 }, ['a', 'b'])
      const input = { a: 'a', b: 10 }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => codec.pack(input as any)).toThrow(new UnionShouldOnlyOneKeyException())
    })
  })
})
