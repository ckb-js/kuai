import { describe, it, expect } from '@jest/globals'
import { BI } from '@ckb-lumos/bi'
import { molecule, number } from '@ckb-lumos/codec'
import { isCodecConfig, MoleculeStorage, UTF8String } from '../../src'

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
    it('Uint128', () => {
      const moleculeStorage = new MoleculeStorage<'Uint128'>('Uint128')
      const res = moleculeStorage.serialize(BI.from(10))
      expect(res).toStrictEqual(number.Uint128.pack(BI.from(10)))
      expect(moleculeStorage.deserialize(res)).toStrictEqual(BI.from(10))
    })
    it('Uint256', () => {
      const moleculeStorage = new MoleculeStorage<'Uint256'>('Uint256')
      const res = moleculeStorage.serialize(BI.from(10))
      expect(res).toStrictEqual(number.Uint256.pack(BI.from(10)))
      expect(moleculeStorage.deserialize(res)).toStrictEqual(BI.from(10))
    })
    it('Uint512', () => {
      const moleculeStorage = new MoleculeStorage<'Uint512'>('Uint512')
      const res = moleculeStorage.serialize(BI.from(10))
      expect(res).toStrictEqual(number.Uint512.pack(BI.from(10)))
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

  describe('test struct', () => {
    it('struct with basic', () => {
      const moleculeStorage = new MoleculeStorage<{ type: 'struct'; value: { a: 'Uint8'; b: 'Uint16' } }>({
        type: 'struct',
        value: { a: 'Uint8', b: 'Uint16' },
      })
      const moleculeFunc = molecule.struct({ a: number.Uint8, b: number.Uint16 }, ['a', 'b'])
      const res = moleculeStorage.serialize({ a: 10, b: 300 })
      expect(res).toStrictEqual(moleculeFunc.pack({ a: 10, b: 300 }))
      expect(moleculeStorage.deserialize(res)).toStrictEqual({ a: 10, b: 300 })
    })
    it('struct with array', () => {
      const moleculeStorage = new MoleculeStorage<{
        type: 'struct'
        value: { a: { type: 'array'; value: ['Uint8', 2] }; b: { type: 'array'; value: ['Uint16', 1] } }
      }>({
        type: 'struct',
        value: {
          a: { type: 'array', value: ['Uint8', 'Uint8'] },
          b: { type: 'array', value: ['Uint16'] },
        },
      })
      const moleculeFunc = molecule.struct(
        { a: molecule.array(number.Uint8, 2), b: molecule.array(number.Uint16, 1) },
        ['a', 'b'],
      )
      const res = moleculeStorage.serialize({ a: [10, 20], b: [300] })
      expect(res).toStrictEqual(moleculeFunc.pack({ a: [10, 20], b: [300] }))
      expect(moleculeStorage.deserialize(res)).toStrictEqual({ a: [10, 20], b: [300] })
    })
    it('struct with struct', () => {
      const moleculeStorage = new MoleculeStorage<{
        type: 'struct'
        value: { a: { type: 'struct'; value: { a: 'Uint8'; b: 'Uint16' } } }
      }>({
        type: 'struct',
        value: {
          a: { type: 'struct', value: { a: 'Uint8', b: 'Uint16' } },
        },
      })
      const moleculeFunc = molecule.struct({ a: molecule.struct({ a: number.Uint8, b: number.Uint16 }, ['a', 'b']) }, [
        'a',
      ])
      const res = moleculeStorage.serialize({ a: { a: 10, b: 300 } })
      expect(res).toStrictEqual(moleculeFunc.pack({ a: { a: 10, b: 300 } }))
      expect(moleculeStorage.deserialize(res)).toStrictEqual({ a: { a: 10, b: 300 } })
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
    it('vec with string', () => {
      const moleculeStorage = new MoleculeStorage<{ type: 'vec'; value: 'string' }>({ type: 'vec', value: 'string' })
      const moleculeFunc = molecule.vector(UTF8String)
      const res = moleculeStorage.serialize(['a', 'b', 'c', 'd', 'ee'])
      expect(res).toStrictEqual(moleculeFunc.pack(['a', 'b', 'c', 'd', 'ee']))
      expect(moleculeStorage.deserialize(res)).toStrictEqual(['a', 'b', 'c', 'd', 'ee'])
    })
    it('vec with array', () => {
      const moleculeStorage = new MoleculeStorage<{ type: 'vec'; value: { type: 'array'; value: ['Uint8', 2] } }>({
        type: 'vec',
        value: { type: 'array', value: ['Uint8', 'Uint8'] },
      })
      const moleculeFunc = molecule.vector(molecule.array(number.Uint8, 2))
      const res = moleculeStorage.serialize([
        [1, 2],
        [2, 10],
      ])
      expect(res).toStrictEqual(
        moleculeFunc.pack([
          [1, 2],
          [2, 10],
        ]),
      )
      expect(moleculeStorage.deserialize(res)).toStrictEqual([
        [1, 2],
        [2, 10],
      ])
    })
    it('vec with struct', () => {
      const moleculeStorage = new MoleculeStorage<{
        type: 'vec'
        value: { type: 'struct'; value: { a: 'Uint8'; b: 'Uint16' } }
      }>({
        type: 'vec',
        value: { type: 'struct', value: { a: 'Uint8', b: 'Uint16' } },
      })
      const moleculeFunc = molecule.vector(molecule.struct({ a: number.Uint8, b: number.Uint16 }, ['a', 'b']))
      const res = moleculeStorage.serialize([
        { a: 10, b: 20 },
        { a: 30, b: 40 },
      ])
      expect(res).toStrictEqual(
        moleculeFunc.pack([
          { a: 10, b: 20 },
          { a: 30, b: 40 },
        ]),
      )
      expect(moleculeStorage.deserialize(res)).toStrictEqual([
        { a: 10, b: 20 },
        { a: 30, b: 40 },
      ])
    })
    it('vec with option', () => {
      const moleculeStorage = new MoleculeStorage<{ type: 'vec'; value: { type: 'option'; value: 'Uint8' } }>({
        type: 'vec',
        value: { type: 'option', value: 'Uint8' },
      })
      const moleculeFunc = molecule.vector(molecule.option(number.Uint8))
      const res = moleculeStorage.serialize([20, 20])
      expect(res).toStrictEqual(moleculeFunc.pack([20, 20]))
      expect(moleculeStorage.deserialize(res)).toStrictEqual([20, 20])
    })
    it('vec with union', () => {
      const moleculeStorage = new MoleculeStorage<{
        type: 'vec'
        value: { type: 'union'; value: { a: 'Uint8'; b: 'string' } }
      }>({
        type: 'vec',
        value: { type: 'union', value: { a: 'Uint8', b: 'string' } },
      })
      const moleculeFunc = molecule.vector(molecule.union({ a: number.Uint8, b: UTF8String }, ['a', 'b']))
      const res = moleculeStorage.serialize([{ a: 10 }, { b: 'bb' }])
      expect(res).toStrictEqual(
        moleculeFunc.pack([
          { type: 'a', value: 10 },
          { type: 'b', value: 'bb' },
        ]),
      )
      expect(moleculeStorage.deserialize(res)).toStrictEqual([{ a: 10 }, { b: 'bb' }])
    })
    it('vec with table', () => {
      const moleculeStorage = new MoleculeStorage<{
        type: 'vec'
        value: { type: 'table'; value: { a: 'Uint8'; b: 'string' } }
      }>({
        type: 'vec',
        value: { type: 'table', value: { a: 'Uint8', b: 'string' } },
      })
      const moleculeFunc = molecule.vector(molecule.table({ a: number.Uint8, b: UTF8String }, ['a', 'b']))
      const res = moleculeStorage.serialize([
        { a: 10, b: 'aa' },
        { a: 20, b: 'bb' },
      ])
      expect(res).toStrictEqual(
        moleculeFunc.pack([
          { a: 10, b: 'aa' },
          { a: 20, b: 'bb' },
        ]),
      )
      expect(moleculeStorage.deserialize(res)).toStrictEqual([
        { a: 10, b: 'aa' },
        { a: 20, b: 'bb' },
      ])
    })
  })

  describe('test option', () => {
    it('option with string', () => {
      const moleculeStorage = new MoleculeStorage<{ type: 'option'; value: 'string' }>({
        type: 'option',
        value: 'string',
      })
      const moleculeFunc = molecule.option(UTF8String)
      const res = moleculeStorage.serialize('aaaaa')
      expect(res).toStrictEqual(moleculeFunc.pack('aaaaa'))
      expect(moleculeStorage.deserialize(res)).toStrictEqual('aaaaa')
    })
    it('option with array', () => {
      const moleculeStorage = new MoleculeStorage<{ type: 'option'; value: { type: 'array'; value: ['Uint8', 2] } }>({
        type: 'option',
        value: { type: 'array', value: ['Uint8', 'Uint8'] },
      })
      const moleculeFunc = molecule.option(molecule.array(number.Uint8, 2))
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

  describe('test table', () => {
    it('table with basic', () => {
      const moleculeStorage = new MoleculeStorage<{ type: 'table'; value: { a: 'Uint8'; b: 'string' } }>({
        type: 'table',
        value: { a: 'Uint8', b: 'string' },
      })
      const moleculeFunc = molecule.table({ a: number.Uint8, b: UTF8String }, ['a', 'b'])
      const res = moleculeStorage.serialize({ a: 10, b: '300' })
      expect(res).toStrictEqual(moleculeFunc.pack({ a: 10, b: '300' }))
      expect(moleculeStorage.deserialize(res)).toStrictEqual({ a: 10, b: '300' })
    })
    it('table with array and struct', () => {
      const moleculeStorage = new MoleculeStorage<{
        type: 'table'
        value: {
          a: { type: 'array'; value: ['Uint8', 2] }
          b: { type: 'struct'; value: { a: 'Uint8'; b: 'Uint16' } }
        }
      }>({
        type: 'table',
        value: {
          a: { type: 'array', value: ['Uint8', 'Uint8'] },
          b: { type: 'struct', value: { a: 'Uint8', b: 'Uint16' } },
        },
      })
      const moleculeFunc = molecule.table(
        { a: molecule.array(number.Uint8, 2), b: molecule.struct({ a: number.Uint8, b: number.Uint16 }, ['a', 'b']) },
        ['a', 'b'],
      )
      const res = moleculeStorage.serialize({ a: [10, 20], b: { a: 10, b: 300 } })
      expect(res).toStrictEqual(moleculeFunc.pack({ a: [10, 20], b: { a: 10, b: 300 } }))
      expect(moleculeStorage.deserialize(res)).toStrictEqual({ a: [10, 20], b: { a: 10, b: 300 } })
    })
    it('table with dynamic type', () => {
      const moleculeStorage = new MoleculeStorage<{
        type: 'table'
        value: {
          a: { type: 'vec'; value: 'string' }
          b: { type: 'option'; value: 'string' }
          c: { type: 'union'; value: { c1: 'Uint8'; c2: 'string' } }
          d: { type: 'table'; value: { d1: 'Uint8'; d2: 'string' } }
        }
      }>({
        type: 'table',
        value: {
          a: { type: 'vec', value: 'string' },
          b: { type: 'option', value: 'string' },
          c: { type: 'union', value: { c1: 'Uint8', c2: 'string' } },
          d: { type: 'table', value: { d1: 'Uint8', d2: 'string' } },
        },
      })
      const moleculeFunc = molecule.table(
        {
          a: molecule.vector(UTF8String),
          b: molecule.option(UTF8String),
          c: molecule.union({ c1: number.Uint8, c2: UTF8String }, ['c1', 'c2']),
          d: molecule.table({ d1: number.Uint8, d2: UTF8String }, ['d1', 'd2']),
        },
        ['a', 'b', 'c', 'd'],
      )
      const res = moleculeStorage.serialize({ a: ['a1', 'a2'], b: 'bbb', c: { c1: 10 }, d: { d1: 10, d2: 'd2' } })
      expect(res).toStrictEqual(
        moleculeFunc.pack({ a: ['a1', 'a2'], b: 'bbb', c: { type: 'c1', value: 10 }, d: { d1: 10, d2: 'd2' } }),
      )
      expect(moleculeStorage.deserialize(res)).toStrictEqual({
        a: ['a1', 'a2'],
        b: 'bbb',
        c: { c1: 10 },
        d: { d1: 10, d2: 'd2' },
      })
    })
  })

  describe('test isCodecConfig', () => {
    it('is false with unexception type', () => {
      expect(isCodecConfig(10)).toBeFalsy()
      expect(isCodecConfig('unknown string')).toBeFalsy()
      expect(isCodecConfig(Symbol(''))).toBeFalsy()
      expect(isCodecConfig(null)).toBeFalsy()
      expect(isCodecConfig(undefined)).toBeFalsy()
      expect(isCodecConfig([1, 2])).toBeFalsy()
      expect(isCodecConfig({ type: 'unknown' })).toBeFalsy()
      expect(
        isCodecConfig(function () {
          console.log('empty')
        }),
      ).toBeFalsy()
    })
    it('test basic type', () => {
      expect(isCodecConfig('Uint8')).toBeTruthy()
      expect(isCodecConfig('Uint16')).toBeTruthy()
      expect(isCodecConfig('Uint32')).toBeTruthy()
      expect(isCodecConfig('Uint64')).toBeTruthy()
      expect(isCodecConfig('Uint128')).toBeTruthy()
      expect(isCodecConfig('Uint256')).toBeTruthy()
      expect(isCodecConfig('Uint512')).toBeTruthy()
      expect(isCodecConfig('string')).toBeTruthy()
    })
    it('test array', () => {
      expect(isCodecConfig({ type: 'array', value: ['Uint8', 'Uint8'] })).toBeTruthy()
      expect(isCodecConfig({ type: 'array', value: ['Uint8', 'Uint16'] })).toBeFalsy()
      expect(isCodecConfig({ type: 'array', value: ['Uint8', 'unknow'] })).toBeFalsy()
    })
    it('test struct', () => {
      expect(isCodecConfig({ type: 'struct', value: { a: 'Uint8', b: 'Uint8' } })).toBeTruthy()
      expect(isCodecConfig({ type: 'struct', value: { a: 'Uint8', b: 'string' } })).toBeFalsy()
      expect(isCodecConfig({ type: 'struct', value: { a: 'Uint8', b: 'unknow' } })).toBeFalsy()
    })
    it('test table', () => {
      expect(isCodecConfig({ type: 'table', value: { a: 'Uint8', b: 'Uint8' } })).toBeTruthy()
      expect(isCodecConfig({ type: 'table', value: { a: 'Uint8', b: 'unknow' } })).toBeFalsy()
    })
    it('test union', () => {
      expect(isCodecConfig({ type: 'union', value: { a: 'Uint8', b: 'Uint8' } })).toBeTruthy()
      expect(isCodecConfig({ type: 'union', value: { a: 'Uint8', b: 'unknow' } })).toBeFalsy()
    })
    it('test vec', () => {
      expect(isCodecConfig({ type: 'vec', value: 'Uint8' })).toBeTruthy()
      expect(isCodecConfig({ type: 'vec', value: 'unknow' })).toBeFalsy()
    })
    it('test option', () => {
      expect(isCodecConfig({ type: 'option', value: 'Uint8' })).toBeTruthy()
      expect(isCodecConfig({ type: 'option', value: 'unknow' })).toBeFalsy()
    })
  })
})
