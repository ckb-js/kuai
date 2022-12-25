import { describe, it, expect } from '@jest/globals'
import { BI } from '@ckb-lumos/bi'
import { molecule, number } from '@ckb-lumos/codec'
import { MoleculeStorage, UTF8String } from '../../src'

describe('test json storage', () => {
  describe('test basic fixed type', () => {
    it('Uint8', () => {
      const moleculeStorage = new MoleculeStorage<{ data: 'Uint8' }>({ data: 'Uint8' })
      const res = moleculeStorage.serialize({ data: 10 })
      expect(res.data).toStrictEqual(number.Uint8.pack(10))
      expect(moleculeStorage.deserialize(res).data).toBe(10)
    })
    it('Uint16', () => {
      const moleculeStorage = new MoleculeStorage<{ data: 'Uint16' }>({ data: 'Uint16' })
      const res = moleculeStorage.serialize({ data: 10 })
      expect(res.data).toStrictEqual(number.Uint16.pack(10))
    })
    it('Uint64', () => {
      const moleculeStorage = new MoleculeStorage<{ data: 'Uint64' }>({ data: 'Uint64' })
      const res = moleculeStorage.serialize({ data: BI.from(10) })
      expect(res.data).toStrictEqual(number.Uint64.pack(BI.from(10)))
      expect(moleculeStorage.deserialize(res).data).toStrictEqual(BI.from(10))
    })
    it('string', () => {
      const moleculeStorage = new MoleculeStorage<{ data: 'string' }>({ data: 'string' })
      const res = moleculeStorage.serialize({ data: 'BI.from(10)' })
      expect(res.data).toStrictEqual(UTF8String.pack('BI.from(10)'))
      expect(moleculeStorage.deserialize(res).data).toBe('BI.from(10)')
    })
  })

  describe('test array', () => {
    it('array with basic', () => {
      const moleculeStorage = new MoleculeStorage<{ data: { _type: 'array'; _params: ['Uint8', 2] } }>({
        data: ['Uint8', 'Uint8'],
      })
      const moleculeFunc = molecule.array(number.Uint8, 2)
      const res = moleculeStorage.serialize({ data: [1, 2] })
      expect(res.data).toStrictEqual(moleculeFunc.pack([1, 2]))
      expect(moleculeStorage.deserialize(res).data).toStrictEqual([1, 2])
    })
  })
})
