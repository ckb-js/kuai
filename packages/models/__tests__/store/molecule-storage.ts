import { describe, it, expect } from '@jest/globals'
import { BI } from '@ckb-lumos/bi'
import { molecule, number } from '@ckb-lumos/codec'
import { MoleculeStorage, UTF8String } from '../../src'

describe('test json storage', () => {
  describe('test basic fixed type', () => {
    it('Uint8', () => {
      const moleculeStorage = new MoleculeStorage<'Uint8'>('Uint8')
      const res = moleculeStorage.serialize(10)
      expect(res).toStrictEqual(number.Uint8.pack(10))
      expect(moleculeStorage.deserialize(res)).toBe(10)
    })
    it('Uint16', () => {
      const moleculeStorage = new MoleculeStorage<'Uint16'>('Uint16')
      const res = moleculeStorage.serialize(10)
      expect(res).toStrictEqual(number.Uint16.pack(10))
    })
    it('Uint64', () => {
      const moleculeStorage = new MoleculeStorage<'Uint64'>('Uint64')
      const res = moleculeStorage.serialize(BI.from(10))
      expect(res).toStrictEqual(number.Uint64.pack(BI.from(10)))
      expect(moleculeStorage.deserialize(res)).toStrictEqual(BI.from(10))
    })
    it('string', () => {
      const moleculeStorage = new MoleculeStorage<'string'>('string')
      const res = moleculeStorage.serialize('BI.from(10)')
      expect(res).toStrictEqual(UTF8String.pack('BI.from(10)'))
      expect(moleculeStorage.deserialize(res)).toBe('BI.from(10)')
    })
  })

  describe('test array', () => {
    it('array with basic', () => {
      const moleculeStorage = new MoleculeStorage<{ type: 'array'; value: ['Uint8', 2] }>({
        type: 'array',
        value: ['Uint8', 'Uint8'],
      })
      const moleculeFunc = molecule.array(number.Uint8, 2)
      const res = moleculeStorage.serialize([1, 2])
      expect(res).toStrictEqual(moleculeFunc.pack([1, 2]))
      expect(moleculeStorage.deserialize(res)).toStrictEqual([1, 2])
    })
    it('array with array', () => {
      const moleculeStorage = new MoleculeStorage<{
        type: 'array'
        value: [{ type: 'array'; value: ['Uint8', 2] }, 2]
      }>({
        type: 'array',
        value: [
          { type: 'array', value: ['Uint8', 'Uint8'] },
          { type: 'array', value: ['Uint8', 'Uint8'] },
        ],
      })
      const moleculeFunc = molecule.array(molecule.array(number.Uint8, 2), 2)
      const res = moleculeStorage.serialize([
        [1, 2],
        [1, 2],
      ])
      expect(res).toStrictEqual(
        moleculeFunc.pack([
          [1, 2],
          [1, 2],
        ]),
      )
      expect(moleculeStorage.deserialize(res)).toStrictEqual([
        [1, 2],
        [1, 2],
      ])
    })
    it('array with struct', () => {
      const moleculeStorage = new MoleculeStorage<{
        type: 'array'
        value: [{ type: 'struct'; value: { a: 'Uint8' } }, 2]
      }>({
        type: 'array',
        value: [
          { type: 'struct', value: { a: 'Uint8' } },
          { type: 'struct', value: { a: 'Uint8' } },
        ],
      })
      const moleculeFunc = molecule.array(molecule.struct({ a: number.Uint8 }, ['a']), 2)
      const res = moleculeStorage.serialize([{ a: 10 }, { a: 20 }])
      expect(res).toStrictEqual(moleculeFunc.pack([{ a: 10 }, { a: 20 }]))
      expect(moleculeStorage.deserialize(res)).toStrictEqual([{ a: 10 }, { a: 20 }])
    })
  })

  describe('test vec', () => {
    it('vec with fixed basic', () => {
      const moleculeStorage = new MoleculeStorage<{ type: 'vec'; value: 'Uint8' }>({ type: 'vec', value: 'Uint8' })
      const moleculeFunc = molecule.vector(number.Uint8)
      const res = moleculeStorage.serialize([1, 2])
      expect(res).toStrictEqual(moleculeFunc.pack([1, 2]))
      expect(moleculeStorage.deserialize(res)).toStrictEqual([1, 2])
    })
  })

  describe('test union', () => {
    it('union with basic', () => {
      const moleculeStorage = new MoleculeStorage<{ type: 'union'; value: { a: 'Uint8'; b: 'Uint64' } }>({
        type: 'union',
        value: { a: 'Uint8', b: 'Uint64' },
      })
      const moleculeFunc = molecule.union({ a: number.Uint8, b: number.Uint64 }, ['a', 'b'])
      const res = moleculeStorage.serialize({ a: 10 })
      expect(res).toStrictEqual(moleculeFunc.pack({ type: 'a', value: 10 }))
      expect(moleculeStorage.deserialize(res)).toStrictEqual({ a: 10 })
    })
    it('union with array', () => {
      const moleculeStorage = new MoleculeStorage<{
        type: 'union'
        value: {
          a: { type: 'array'; value: ['Uint8', 2] }
          b: { type: 'array'; value: ['Uint64', 2] }
        }
      }>({
        type: 'union',
        value: { a: { type: 'array', value: ['Uint8', 'Uint8'] }, b: { type: 'array', value: ['Uint64', 'Uint64'] } },
      })
      const moleculeFunc = molecule.union({ a: molecule.array(number.Uint8, 2), b: molecule.array(number.Uint64, 2) }, [
        'a',
        'b',
      ])
      const originalValue: { a: [number, number] } = { a: [10, 10] }
      const res = moleculeStorage.serialize(originalValue)
      expect(res).toStrictEqual(moleculeFunc.pack({ type: 'a', value: originalValue.a }))
      expect(moleculeStorage.deserialize(res)).toStrictEqual(originalValue)
    })
    it('union with struct', () => {
      const moleculeStorage = new MoleculeStorage<{
        type: 'union'
        value: {
          a: { type: 'struct'; value: { a: 'Uint8'; b: 'Uint8' } }
          b: { type: 'struct'; value: { a: 'Uint64'; b: 'Uint64' } }
        }
      }>({
        type: 'union',
        value: {
          a: { type: 'struct', value: { a: 'Uint8', b: 'Uint8' } },
          b: { type: 'struct', value: { a: 'Uint64', b: 'Uint64' } },
        },
      })
      const moleculeFunc = molecule.union(
        {
          a: molecule.struct({ a: number.Uint8, b: number.Uint8 }, ['a', 'b']),
          b: molecule.struct({ a: number.Uint64, b: number.Uint64 }, ['a', 'b']),
        },
        ['a', 'b'],
      )
      const originalValue: { a: { a: number; b: number } } = { a: { a: 10, b: 10 } }
      const res = moleculeStorage.serialize(originalValue)
      expect(res).toStrictEqual(moleculeFunc.pack({ type: 'a', value: originalValue.a }))
      expect(moleculeStorage.deserialize(res)).toStrictEqual(originalValue)
    })
  })
})
