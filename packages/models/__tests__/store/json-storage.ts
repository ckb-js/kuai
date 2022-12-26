import BigNumber from 'bignumber.js'
import { describe, it, expect } from '@jest/globals'
import { addMarkForStorage, JSONStorage } from '../../src'
import { UnExpectedParamsException, UnexpectedTypeException } from '../../src/exceptions'

describe('test json storage', () => {
  describe('only data exist', () => {
    it('simple object', () => {
      const storage = new JSONStorage()
      const res = storage.serialize({ data: {} })
      const original = storage.deserialize(res)
      expect(original).toStrictEqual({ data: {} })
    })

    it('only one layer', () => {
      const storage = new JSONStorage<{ data: { a: BigNumber; b: string; c: boolean; d: boolean; e: BigNumber } }>()
      const data = { a: BigNumber(1), b: 'b', c: true, d: false, e: BigNumber('100') }
      const res = storage.serialize({ data })
      const original = storage.deserialize(res)
      Object.keys(data).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((original.data as any)[key]).toStrictEqual((data as any)[key])
      })
    })

    it('more than one layer', () => {
      const storage = new JSONStorage<{ data: { lay: { b: string; c: boolean; d: boolean; e: BigNumber } } }>()
      const data = { b: 'b', c: true, d: false, e: BigNumber('100') }
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
      const storage = new JSONStorage<{ witness: { b: string; c: boolean; d: boolean; e: BigNumber } }>()
      const witness = { b: 'b', c: true, d: false, e: BigNumber('100') }
      const res = storage.serialize({ witness })
      const original = storage.deserialize(res)
      Object.keys(witness).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((original.witness as any)[key]).toEqual((witness as any)[key])
      })
    })

    it('more than one layer', () => {
      const storage = new JSONStorage<{
        witness: { lay: { b: string; c: boolean; d: boolean; e: BigNumber } }
      }>()
      const witness = { b: 'b', c: true, d: false, e: BigNumber('100') }
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
        data: BigNumber
        witness: { lay: { b: string; c: boolean; d: boolean; e: BigNumber } }
      }>()
      const witness = { b: 'b', c: true, d: false, e: BigNumber('100') }
      const res = storage.serialize({ data: BigNumber(10), witness: { lay: witness } })
      const original = storage.deserialize(res)
      Object.keys(witness).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((original.witness.lay as any)[key]).toEqual((witness as any)[key])
      })
      expect(original.data).toStrictEqual(BigNumber(10))
    })
  })

  describe('some exception withnot type', () => {
    const storage = new JSONStorage()
    it('serialize with empty', () => {
      const res = storage.serialize({})
      expect(res).toStrictEqual(Buffer.from(JSON.stringify({})))
    })
    it('serialize with null in data', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => storage.serialize({ a: null } as any)).toThrow(new UnexpectedTypeException('null'))
    })
    it('serialize with null', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (storage.serialize as any)(null)).toThrow(new UnexpectedTypeException('null'))
    })
    it('serialize with undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (storage.serialize as any)()).toThrow(new UnexpectedTypeException('undefined'))
    })
    it('deserialize with null in data', () => {
      expect(() => storage.deserialize(Buffer.from(JSON.stringify({ a: null })))).toThrow(
        new UnexpectedTypeException('null'),
      )
    })
    it('deserialize with null', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (storage.deserialize as any)(null)).toThrow(new UnExpectedParamsException('null'))
    })
    it('deserialize with undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (storage.deserialize as any)()).toThrow(new UnExpectedParamsException('undefined'))
    })
  })

  describe('test addMarkForStorage', () => {
    it('is null', () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addMarkForStorage(null as any)
      } catch (error) {
        expect(error).toBeInstanceOf(UnexpectedTypeException)
      }
    })
    it('is undefined', () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        addMarkForStorage(null as any)
      } catch (error) {
        expect(error).toBeInstanceOf(UnexpectedTypeException)
      }
    })
    it('is BigNumber Array', () => {
      const res = addMarkForStorage([BigNumber(10), BigNumber(20)])
      expect(res).toStrictEqual(['210', '220'])
    })
    it('is simple obj', () => {
      const res = addMarkForStorage({ a: 's', b: true, c: BigNumber(10) })
      expect(res).toStrictEqual({
        a: '0s',
        b: '1true',
        c: '210',
      })
    })
    it('is complex obj', () => {
      const res = addMarkForStorage({
        a: [BigNumber(10), BigNumber(20)],
        b: { c: { e: BigNumber(20) }, d: [BigNumber(20)] },
        e: BigNumber(10),
      })
      expect(res).toStrictEqual({
        a: ['210', '220'],
        b: { c: { e: '220' }, d: ['220'] },
        e: '210',
      })
    })
  })
})
