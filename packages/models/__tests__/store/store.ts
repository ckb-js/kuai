import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NonExistentException, NonStorageInstanceException } from '../../src/exceptions'
import { ChainStorage, JSONStore, StorageOffChain, StorageOnChain, Store } from '../../src/store'
import { Behavior } from '../../src/utils'

const ref = {
  name: '',
  protocol: '',
  path: '',
  uri: '',
}

type CustomType = string

const serializeMock = jest.fn()
const deserializeMock = jest.fn()

class StorageCustom<T extends StorageOffChain<CustomType>> extends ChainStorage<T> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  serialize(data: T): StorageOnChain {
    serializeMock()
    return {
      data: Buffer.from(''),
      witness: Buffer.from(''),
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deserialize(data: StorageOnChain): T {
    deserializeMock()
    return {
      data: '10',
      witness: '10',
    } as T
  }
}

class CustomStore<T extends StorageOffChain<CustomType>> extends Store<StorageCustom<T>> {
  storageInstance = new StorageCustom<T>()
}

class NoInstanceCustomStore<T extends StorageOffChain<CustomType>> extends Store<StorageCustom<T>> {
  storageInstance = new StorageCustom<T>()
}

describe('tes store', () => {
  describe('use json storage', () => {
    describe('test handleCall with add', () => {
      const store = new JSONStore<{ data: { a: number } }>()
      it('add success', () => {
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            symbol: Symbol('normal'),
            value: {
              type: 'add_state',
              add: {
                '0x1234': { data: { a: 1 } },
              },
            },
          },
        })
        expect(store.get('0x1234')).toStrictEqual({ data: { a: 1 } })
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
                '0x1234': { data: { a: 2 } },
              },
            },
          },
        })
        expect(store.get('0x1234')).toStrictEqual({ data: { a: 2 } })
      })
    })

    describe('test handleCall with sub', () => {
      const store = new JSONStore<{ data: { a: number } }>()
      beforeEach(() => {
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            symbol: Symbol('normal'),
            value: {
              type: 'add_state',
              add: {
                '0x1234': { data: { a: 1 } },
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
      const store = new JSONStore<{ data: { a: number } }>()
      store.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          symbol: Symbol('normal'),
          value: {
            type: 'add_state',
            add: {
              '0x1234': { data: { a: 1 } },
            },
          },
        },
      })
      const cloneRes = store.clone()
      expect(cloneRes.get('0x1234') === store.get('0x1234')).toBeFalsy()
      expect(cloneRes.get('0x1234')).toStrictEqual(store.get('0x1234'))
    })

    describe('test get', () => {
      const store = new JSONStore<{ data: { a: number } }>()
      store.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          symbol: Symbol('normal'),
          value: {
            type: 'add_state',
            add: {
              '0x1234': { data: { a: 1 } },
            },
          },
        },
      })
      it('get success without path', () => {
        expect(store.get('0x1234')).toStrictEqual({ data: { a: 1 } })
      })
      it('get success with first path', () => {
        expect(store.get('0x1234', ['data'])).toStrictEqual({ a: 1 })
      })
      it('get success with path', () => {
        expect(store.get('0x1234', ['data', 'a'])).toEqual(1)
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
      const store = new JSONStore<{ data: { a: number } }>()
      beforeEach(() => {
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            symbol: Symbol('normal'),
            value: {
              type: 'add_state',
              add: {
                '0x1234': { data: { a: 1 } },
              },
            },
          },
        })
      })
      it('set success without path', () => {
        store.set('0x1234', { data: { a: 2 } })
        expect(store.get('0x1234')).toStrictEqual({ data: { a: 2 } })
      })
      it('set success with data path', () => {
        store.set('0x1234', { a: 2 }, ['data'])
        expect(store.get('0x1234')).toStrictEqual({ data: { a: 2 } })
      })
      it('set success with data inner path', () => {
        store.set('0x1234', 10, ['data', 'a'])
        expect(store.get('0x1234')).toStrictEqual({ data: { a: 10 } })
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
      const store = new JSONStore<{ data: { a: number } }>()
      beforeEach(() => {
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            symbol: Symbol('normal'),
            value: {
              type: 'add_state',
              add: {
                '0x1234': { data: { a: 1 } },
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
        expect(store.get('0x1234')).toStrictEqual({ data: { a: 1 } })
      })
    })
  })

  describe('extend store', () => {
    it('success', () => {
      const custom = new CustomStore<{ data: string }>()
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
      try {
        const custom = new NoInstanceCustomStore<{ data: string }>()
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
      } catch (error) {
        expect(error).toBeInstanceOf(NonStorageInstanceException)
      }
    })
  })
})
