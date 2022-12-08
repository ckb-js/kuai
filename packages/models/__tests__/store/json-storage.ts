import { describe, it, expect } from '@jest/globals'
import { JSONStorage } from '../../src'

describe('test json storage', () => {
  describe('only data exist', () => {
    it('simple object', () => {
      const storage = new JSONStorage()
      const res = storage.serialize({ data: {} })
      const original = storage.deserialize(res)
      expect(original).toStrictEqual({ data: {} })
    })

    it('only one layer', () => {
      const storage = new JSONStorage<{ data: { a: number; b: string; c: boolean; d: boolean; e: bigint } }>()
      const data = { a: 1, b: 'b', c: true, d: false, e: BigInt('100') }
      const res = storage.serialize({ data })
      const original = storage.deserialize(res)
      Object.keys(data).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((original.data as any)[key]).toEqual((data as any)[key])
      })
    })

    it('more than one layer', () => {
      const storage = new JSONStorage<{ data: { lay: { a: number; b: string; c: boolean; d: boolean; e: bigint } } }>()
      const data = { a: 1, b: 'b', c: true, d: false, e: BigInt('100') }
      const res = storage.serialize({ data: { lay: data } })
      const original = storage.deserialize(res)
      Object.keys(data).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((original.data.lay as any)[key]).toEqual((data as any)[key])
      })
    })
  })

  describe('only witness exist', () => {
    it('simple object', () => {
      const storage = new JSONStorage()
      const res = storage.serialize({ witness: {} })
      const original = storage.deserialize(res)
      expect(original).toStrictEqual({ witness: {} })
    })
    it('only one layer', () => {
      const storage = new JSONStorage<{ witness: { a: number; b: string; c: boolean; d: boolean; e: bigint } }>()
      const witness = { a: 1, b: 'b', c: true, d: false, e: BigInt('100') }
      const res = storage.serialize({ witness })
      const original = storage.deserialize(res)
      Object.keys(witness).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((original.witness as any)[key]).toEqual((witness as any)[key])
      })
    })

    it('more than one layer', () => {
      const storage = new JSONStorage<{
        witness: { lay: { a: number; b: string; c: boolean; d: boolean; e: bigint } }
      }>()
      const witness = { a: 1, b: 'b', c: true, d: false, e: BigInt('100') }
      const res = storage.serialize({ witness: { lay: witness } })
      const original = storage.deserialize(res)
      Object.keys(witness).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((original.witness.lay as any)[key]).toEqual((witness as any)[key])
      })
    })
  })

  describe('data and witness exist', () => {
    it('simple object', () => {
      const storage = new JSONStorage()
      const res = storage.serialize({ witness: {}, data: {} })
      const original = storage.deserialize(res)
      expect(original).toStrictEqual({ witness: {}, data: {} })
    })

    it('more than one layer', () => {
      const storage = new JSONStorage<{
        data: number
        witness: { lay: { a: number; b: string; c: boolean; d: boolean; e: bigint } }
      }>()
      const witness = { a: 1, b: 'b', c: true, d: false, e: BigInt('100') }
      const res = storage.serialize({ data: 10, witness: { lay: witness } })
      const original = storage.deserialize(res)
      Object.keys(witness).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((original.witness.lay as any)[key]).toEqual((witness as any)[key])
      })
      expect(original.data).toBe(10)
    })
  })
})
