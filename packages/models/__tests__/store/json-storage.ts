import { describe, it, expect, jest } from '@jest/globals'
import { JSONStorage } from '../../src'
import { UnexpectedParamsException } from '../../src/exceptions'

const mockXAdd = jest.fn()
const mockXRead = jest.fn<() => void>()
jest.mock('ioredis', () => {
  return class Redis {
    xread = mockXRead
    xadd = mockXAdd
  }
})

describe('test json storage', () => {
  describe('only data exist', () => {
    it('simple object', () => {
      const storage = new JSONStorage()
      const res = storage.serialize({ data: {} })
      const original = storage.deserialize(res)
      expect(original).toStrictEqual({ data: {} })
    })

    it('only one layer', () => {
      const storage = new JSONStorage<{ data: { b: string } }>()
      const data = { b: 'b' }
      const res = storage.serialize({ data })
      const original = storage.deserialize(res)
      Object.keys(data).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((original.data as any)[key]).toStrictEqual((data as any)[key])
      })
    })

    it('more than one layer', () => {
      const storage = new JSONStorage<{ data: { lay: { b: string; e: string } } }>()
      const data = { b: 'b', e: '100' }
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
      const storage = new JSONStorage<{ witness: { b: string; e: string } }>()
      const witness = { b: 'b', e: '100' }
      const res = storage.serialize({ witness })
      const original = storage.deserialize(res)
      Object.keys(witness).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((original.witness as any)[key]).toEqual((witness as any)[key])
      })
    })

    it('more than one layer', () => {
      const storage = new JSONStorage<{
        witness: { lay: { b: string } }
      }>()
      const witness = { b: 'b' }
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
        data: string
        witness: { lay: { b: string } }
      }>()
      const witness = { b: 'b' }
      const res = storage.serialize({ data: '10', witness: { lay: witness } })
      const original = storage.deserialize(res)
      Object.keys(witness).forEach((key) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((original.witness.lay as any)[key]).toEqual((witness as any)[key])
      })
      expect(original.data).toStrictEqual('10')
    })
  })

  describe('some exception withnot type', () => {
    const storage = new JSONStorage()
    it('serialize with empty', () => {
      const res = storage.serialize({})
      expect(res).toStrictEqual(Buffer.from(JSON.stringify({})))
    })
    it('deserialize with null', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (storage.deserialize as any)(null)).toThrow(new UnexpectedParamsException('null'))
    })
    it('deserialize with undefined', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (storage.deserialize as any)()).toThrow(new UnexpectedParamsException('undefined'))
    })
  })
})
