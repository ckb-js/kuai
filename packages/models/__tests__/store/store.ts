import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NonExistentException, NonStorageInstanceException } from '../../src/exceptions'
import { StorageTemplate, ChainStorage, JSONStore, Store, Behavior, ProviderKey, StorageType } from '../../src'
import BigNumber from 'bignumber.js'

const ref = {
  name: '',
  protocol: '',
  path: '',
  uri: 'json',
}

type CustomType = string

const serializeMock = jest.fn()
const deserializeMock = jest.fn()

class StorageCustom<T extends StorageTemplate<CustomType>> extends ChainStorage<T> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  serialize(data: StorageType<T>['offChain']): StorageType<T>['onChain'] {
    serializeMock()
    return {
      data: Buffer.from(''),
      witness: Buffer.from(''),
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deserialize(data: StorageType<T>['onChain']): StorageType<T>['offChain'] {
    deserializeMock()
    return {
      data: '10',
      witness: '20',
    }
  }
}

class CustomStore<T extends StorageTemplate<CustomType>> extends Store<StorageCustom<T>> {
  storageInstance = new StorageCustom<T>()
  cloneConfig(): CustomStore<T> {
    return new CustomStore<T>(this.scriptType)
  }
}

class NoInstanceCustomStore<T extends StorageTemplate<CustomType>> extends Store<StorageCustom<T>> {
  cloneConfig(): NoInstanceCustomStore<T> {
    return new NoInstanceCustomStore<T>(this.scriptType)
  }
}

Reflect.defineMetadata(ProviderKey.Actor, { ref }, Store)
Reflect.defineMetadata(ProviderKey.Actor, { ref }, JSONStore)
Reflect.defineMetadata(ProviderKey.Actor, { ref }, CustomStore)
Reflect.defineMetadata(ProviderKey.Actor, { ref }, NoInstanceCustomStore)

describe('test store', () => {
  describe('use json storage', () => {
    describe('test handleCall with add', () => {
      const store = new JSONStore<{ data: { a: BigNumber } }>('lock')
      it('add success', () => {
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            symbol: Symbol('normal'),
            value: {
              type: 'add_state',
              add: {
                '0x1234': { data: { a: BigNumber(1) } },
              },
            },
          },
        })
        expect(store.get('0x1234')).toStrictEqual({ data: { a: BigNumber(1) } })
      })
      it('add with no add params', () => {
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            symbol: Symbol('normal'),
            value: {
              type: 'add_state',
            },
          },
        })
      })
      it('add with duplicate add params', () => {
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            symbol: Symbol('normal'),
            value: {
              type: 'add_state',
              add: {
                '0x1234': { data: { a: BigNumber(2) } },
              },
            },
          },
        })
        expect(store.get('0x1234')).toStrictEqual({ data: { a: BigNumber(2) } })
      })
    })

    describe('test handleCall with sub', () => {
      const store = new JSONStore<{ data: { a: BigNumber } }>('lock')
      beforeEach(() => {
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            symbol: Symbol('normal'),
            value: {
              type: 'add_state',
              add: {
                '0x1234': { data: { a: BigNumber(1) } },
              },
            },
          },
        })
      })
      it('remove success', () => {
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            symbol: Symbol('normal'),
            value: {
              type: 'remove_state',
              remove: ['0x1234'],
            },
          },
        })
        expect(store.get('0x1234')).toBeUndefined()
      })
      it('remove failed', () => {
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            symbol: Symbol('normal'),
            value: {
              type: 'remove_state',
              remove: ['0x123411'],
            },
          },
        })
        expect(store.get('0x1234')).toBeDefined()
      })
    })

    it('test clone', () => {
      const store = new JSONStore<{ data: { a: BigNumber } }>('lock')
      store.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          symbol: Symbol('normal'),
          value: {
            type: 'add_state',
            add: {
              '0x1234': { data: { a: BigNumber(1) } },
            },
          },
        },
      })
      const cloneRes = store.clone()
      expect(cloneRes.get('0x1234') === store.get('0x1234')).toBeFalsy()
      expect(cloneRes.get('0x1234')).toStrictEqual(store.get('0x1234'))
      expect(cloneRes instanceof JSONStore).toBe(true)
    })

    describe('test get', () => {
      const store = new JSONStore<{ data: { a: BigNumber } }>('lock')
      store.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          symbol: Symbol('normal'),
          value: {
            type: 'add_state',
            add: {
              '0x1234': { data: { a: BigNumber(1) } },
            },
          },
        },
      })
      it('get success without path', () => {
        expect(store.get('0x1234')).toStrictEqual({ data: { a: BigNumber(1) } })
      })
      it('get success with first path', () => {
        expect(store.get('0x1234', ['data'])).toStrictEqual({ a: BigNumber(1) })
      })
      it('get success with path', () => {
        expect(store.get('0x1234', ['data', 'a'])).toEqual(BigNumber(1))
      })
      it('get with non existent exception no outpoint', () => {
        try {
          store.get('0x1234111', ['data', 'a111'])
        } catch (error) {
          expect(error).toBeInstanceOf(NonExistentException)
        }
      })
      it('get with non existent exception', () => {
        try {
          store.get('0x1234', ['data', 'a111'])
        } catch (error) {
          expect(error).toBeInstanceOf(NonExistentException)
        }
      })
    })

    describe('test set', () => {
      const store = new JSONStore<{ data: { a: BigNumber; b: { c: BigNumber } } }>('lock')
      beforeEach(() => {
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            symbol: Symbol('normal'),
            value: {
              type: 'add_state',
              add: {
                '0x1234': { data: { a: BigNumber(1), b: { c: BigNumber(1) } } },
              },
            },
          },
        })
      })
      it('set success without path', () => {
        store.set('0x1234', { data: { a: BigNumber(2), b: { c: BigNumber(1) } } })
        expect(store.get('0x1234')).toStrictEqual({ data: { a: BigNumber(2), b: { c: BigNumber(1) } } })
      })
      it('set success with data path', () => {
        store.set('0x1234', { a: BigNumber(2), b: { c: BigNumber(1) } }, ['data'])
        expect(store.get('0x1234')).toStrictEqual({ data: { a: BigNumber(2), b: { c: BigNumber(1) } } })
      })
      it('set success with data inner path', () => {
        store.set('0x1234', { c: BigNumber(10) }, ['data', 'b'])
        expect(store.get('0x1234')).toStrictEqual({ data: { a: BigNumber(1), b: { c: BigNumber(10) } } })
      })
      it('get with non existent exception', () => {
        try {
          store.get('0x1234', ['data', 'a111'])
        } catch (error) {
          expect(error).toBeInstanceOf(NonExistentException)
        }
      })
    })

    describe('test remove', () => {
      const store = new JSONStore<{ data: { a: BigNumber } }>('lock')
      beforeEach(() => {
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            symbol: Symbol('normal'),
            value: {
              type: 'add_state',
              add: {
                '0x1234': { data: { a: BigNumber(1) } },
              },
            },
          },
        })
      })
      it('remove success without path', () => {
        store.remove('0x1234')
        expect(store.get('0x1234')).toBeUndefined()
      })
      it('remove with non exist path', () => {
        store.remove('0x1234111')
        expect(store.get('0x1234')).toStrictEqual({ data: { a: BigNumber(1) } })
      })
    })
  })

  describe('extend store', () => {
    it('success', () => {
      const custom = new CustomStore<{ data: string }>('lock')
      custom.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          symbol: Symbol('normal'),
          value: {
            type: 'add_state',
            add: {
              '0x1234': { data: '' },
            },
          },
        },
      })
      custom.clone()
      expect(serializeMock).toBeCalled()
      expect(deserializeMock).toBeCalled()
    })

    it('exception', () => {
      const custom = new NoInstanceCustomStore<{ data: string }>('lock')
      custom.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          symbol: Symbol('normal'),
          value: {
            type: 'add_state',
            add: {
              '0x1234': { data: '' },
            },
          },
        },
      })
      expect(() => custom.clone()).toThrow(new NonStorageInstanceException())
    })
  })
})
