import { describe, expect, it } from '@jest/globals'
import { CellChangeBuffer } from '../../src/resource-binding/cell-change-buffer'
import { CellChangeData, ResourceBindingRegistry } from '../../src'
import { Input, Cell } from '@ckb-lumos/base'

describe('CellChangeBuffer', () => {
  const registry: ResourceBindingRegistry = {
    uri: 'local://testActor',
    pattern: '',
  }
  const input: Input = {
    previousOutput: {
      txHash: '0x637c22b7a3870de160455e34bbf6aa9957d8eefb897548951303044175e0ee8f',
      index: '0x1',
    },
    since: '',
  }
  const witness = '0x'
  const cell: Cell = {
    cellOutput: {
      capacity: '0x1000',
      lock: {
        codeHash: '0x1c04df09d9adede5bfc40ff1a39a3a17fc8e29f15c56f16b7e48680c600ee5ac',
        hashType: 'type',
        args: '0xc0464bbb406441b651e84d2b20bb3d2c9a0c05f595b053b8409a607e6554775f',
      },
      type: {
        codeHash: '0x00000000000000000000000000000000000000000000000000545950455f4944',
        hashType: 'type',
        args: '0xf26f761463b4d66b1b4e69e8f8dc097003572faeeb6751f1ff283b6fb2b85082',
      },
    },
    data: '0x',
    outPoint: {
      txHash: '0xfeb8784185ed6880e318610333989db5a4bb9fdaca054564859bd2b66e18eac3',
      index: '0x0',
    },
  }
  const change: [ResourceBindingRegistry, Input[], CellChangeData[]] = [registry, [input], [[cell, witness]]]

  describe('ReadyList', () => {
    it('signal ready should success', () => {
      const buffer = new CellChangeBuffer()
      buffer.signalReady(registry.uri)
      expect(buffer.readyList).toEqual([registry.uri])
    })
  })

  describe('Push', () => {
    it('push should success when empty', () => {
      const buffer = new CellChangeBuffer()
      buffer.push(registry.uri, change)
      expect(buffer.buffer.get(registry.uri)).toEqual([change])
    })

    it('push should success when not empty', () => {
      const buffer = new CellChangeBuffer()
      buffer.push(registry.uri, change)
      buffer.push(registry.uri, change)
      expect(buffer.buffer.get(registry.uri)).toEqual([change, change])
    })
  })

  describe('Pop', () => {
    it('undefined should be returned when empty', () => {
      const buffer = new CellChangeBuffer()
      expect(buffer.pop()).toBeUndefined()
    })

    it('data should be returned and removed from ready list', () => {
      const buffer = new CellChangeBuffer()
      buffer.push(registry.uri, change)
      buffer.signalReady(registry.uri)
      expect(buffer.pop()).toEqual([change])
      expect(buffer.buffer.get(registry.uri)).toBeUndefined()
      expect(buffer.readyList).toEqual([])
    })

    it('all data should be returned and removed from ready list while popAll called', () => {
      const registry2: ResourceBindingRegistry = {
        uri: 'local://testActor2',
        pattern: '',
      }
      const buffer = new CellChangeBuffer()
      buffer.push(registry.uri, change)
      buffer.push(registry2.uri, change)
      buffer.signalReady(registry.uri)
      buffer.signalReady(registry2.uri)
      expect(buffer.popAll()).toEqual([[change], [change]])
      expect(buffer.buffer.get(registry.uri)).toBeUndefined()
      expect(buffer.buffer.get(registry2.uri)).toBeUndefined()
      expect(buffer.readyList).toEqual([])
    })

    it('only data in ready list should be poped out while calling popAll', () => {
      const registry2: ResourceBindingRegistry = {
        uri: 'local://testActor2',
        pattern: '',
      }
      const buffer = new CellChangeBuffer()
      buffer.push(registry.uri, change)
      buffer.push(registry2.uri, change)
      buffer.signalReady(registry.uri)
      expect(buffer.popAll()).toEqual([[change]])
      expect(buffer.buffer.get(registry.uri)).toBeUndefined()
      expect(buffer.buffer.get(registry2.uri)).toEqual([change])
      expect(buffer.readyList).toEqual([])
    })
  })
})
