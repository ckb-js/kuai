import { bytes } from '@ckb-lumos/codec'
import { Cell, HexString, Script } from '@ckb-lumos/base'
import BigNumber from 'bignumber.js'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NonExistentException, NonStorageInstanceException } from '../../src/exceptions'
import {
  ChainStorage,
  JSONStore,
  Store,
  Behavior,
  ProviderKey,
  StorageLocation,
  StorageSchema,
  JSONStorage,
} from '../../src'

const mockXAdd = jest.fn()
const mockXRead = jest.fn<() => void>()
jest.mock('ioredis', () => {
  return class Redis {
    xread = mockXRead
    xadd = mockXAdd
  }
})

const mockXAdd = jest.fn()
const mockXRead = jest.fn<() => void>()
jest.mock('ioredis', () => {
  return class Redis {
    xread = mockXRead
    xadd = mockXAdd
  }
})

const ref = {
  name: '',
  protocol: '',
  path: '',
  uri: 'json',
}

type CustomType = string

const serializeMock = jest.fn()
const deserializeMock = jest.fn()

class StorageCustom<T extends CustomType = CustomType> extends ChainStorage<T> {
  serialize(data: T): Uint8Array {
    serializeMock()
    return Buffer.from(data)
  }

  deserialize(data: Uint8Array): T {
    deserializeMock()
    return data.toString() as T
  }
}

class CustomStore<R extends StorageSchema<CustomType>> extends Store<StorageCustom<CustomType>, R> {
  getStorage(_storeKey: StorageLocation): StorageCustom<string> {
    return new StorageCustom()
  }
}

class NoInstanceCustomStore<R extends StorageSchema<CustomType>> extends Store<StorageCustom<CustomType>, R> {}

Reflect.defineMetadata(ProviderKey.Actor, { ref }, Store)
Reflect.defineMetadata(ProviderKey.Actor, { ref }, JSONStore)
Reflect.defineMetadata(ProviderKey.Actor, { ref }, CustomStore)
Reflect.defineMetadata(ProviderKey.Actor, { ref }, NoInstanceCustomStore)

const createCell = ({
  lock,
  data,
  type,
}: {
  type?: Script
  lock?: Script
  data?: HexString
} = {}): Cell => {
  return {
    cellOutput: {
      capacity: '0x16b969d00',
      lock: lock || {
        codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
        hashType: 'type',
        args: '0x',
      },
      type,
    },
    data: data || '0x',
    outPoint: {
      txHash: `0x${'0'.repeat(64)}`,
      index: '0x0',
    },
  }
}

const defaultOutpoint = `0x${'0'.repeat(64)}0`

describe('test store', () => {
  describe('use json storage', () => {
    describe('test init chain data', () => {
      it('init with data', () => {
        const store = new JSONStore<{ data: { a: BigNumber } }>({ data: true })
        const chainData = store.initOnChain({ data: { a: BigNumber(20) } })
        const expected = bytes.hexify(new JSONStorage().serialize({ a: BigNumber(20) }))
        expect(chainData.data).toBe(expected)
        expect(chainData.witness).toBeUndefined()
        expect(chainData.lock).toBeUndefined()
        expect(chainData.type).toBeUndefined()
      })
      it('init with witness', () => {
        const store = new JSONStore<{ witness: { a: BigNumber } }>({ witness: true })
        const chainData = store.initOnChain({ witness: { a: BigNumber(20) } })
        const expected = bytes.hexify(new JSONStorage().serialize({ a: BigNumber(20) }))
        expect(chainData.witness).toBe(expected)
        expect(chainData.data).toBeUndefined()
        expect(chainData.lock).toBeUndefined()
        expect(chainData.type).toBeUndefined()
      })
      it('init with lock', () => {
        const store = new JSONStore<{ lock: { args: BigNumber; codeHash: { schema: { a: string }; offset: 10 } } }>({
          lock: { args: true, codeHash: { offset: 10 } },
        })
        const chainData = store.initOnChain({ lock: { args: BigNumber(20), codeHash: { a: 'aaaaaa' } } })
        const expectedArgs = bytes.hexify(new JSONStorage().serialize(BigNumber(20)))
        const expectedCodeHash = bytes.hexify(new JSONStorage().serialize({ a: 'aaaaaa' }))
        expect(chainData.lock.args).toBe(expectedArgs)
        expect(chainData.lock.codeHash).toBe(`0x${'0'.repeat(10)}${expectedCodeHash.slice(2)}`)
        expect(chainData.data).toBeUndefined()
        expect(chainData.witness).toBeUndefined()
        expect(chainData.type).toBeUndefined()
      })
      it('init with type', () => {
        const store = new JSONStore<{ type: { args: BigNumber; codeHash: { schema: { a: string }; offset: 10 } } }>({
          type: { args: true, codeHash: { offset: 10 } },
        })
        const chainData = store.initOnChain({ type: { args: BigNumber(20), codeHash: { a: 'aaaaaa' } } })
        const expectedArgs = bytes.hexify(new JSONStorage().serialize(BigNumber(20)))
        const expectedCodeHash = bytes.hexify(new JSONStorage().serialize({ a: 'aaaaaa' }))
        expect(chainData.type.args).toBe(expectedArgs)
        expect(chainData.type.codeHash).toBe(`0x${'0'.repeat(10)}${expectedCodeHash.slice(2)}`)
        expect(chainData.data).toBeUndefined()
        expect(chainData.witness).toBeUndefined()
        expect(chainData.lock).toBeUndefined()
      })
    })

    describe('test handleCall with add', () => {
      it('add data success', () => {
        const store = new JSONStore<{ data: { a: BigNumber } }>({ data: true })
        const initValue = { a: BigNumber(1) }
        const onchainData = store.initOnChain({ data: initValue })
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell({ data: onchainData.data }),
                witness: '',
              },
            },
          },
        })
        expect(store.get(defaultOutpoint)).toStrictEqual({ data: initValue })
      })
      it('add witness success', () => {
        const store = new JSONStore<{ witness: { a: BigNumber } }>({ witness: true })
        const initValue = { a: BigNumber(1) }
        const onchainData = store.initOnChain({ witness: initValue })
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell(),
                witness: onchainData.witness,
              },
            },
          },
        })
        expect(store.get(defaultOutpoint)).toStrictEqual({ witness: initValue })
      })
      it('add with duplicate add params', () => {
        const store = new JSONStore<{ data: { a: BigNumber } }>({ data: true })
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell({ data: store.initOnChain({ data: { a: BigNumber(1) } }).data }),
                witness: '',
              },
            },
          },
        })
        const initValue = { a: BigNumber(10) }
        const onchainData = store.initOnChain({ data: initValue })
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell({ data: onchainData.data }),
                witness: '',
              },
            },
          },
        })
        expect(store.get(defaultOutpoint)).toStrictEqual({ data: initValue })
      })
      it('add lock without offset', () => {
        const lockStore = new JSONStore<{ lock: { args: BigNumber } }>({ lock: { args: true } })
        const initValue = { args: BigNumber(1) }
        const onchainData = lockStore.initOnChain({ lock: initValue })
        lockStore.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell({ lock: { args: onchainData.lock.args, codeHash: '', hashType: 'data' } }),
                witness: '',
              },
            },
          },
        })
        expect(lockStore.get(defaultOutpoint)).toStrictEqual({ lock: initValue })
      })
      it('add lock with offset', () => {
        const lockStore = new JSONStore<{ lock: { args: { offset: 10; schema: BigNumber } } }>({
          lock: { args: { offset: 10 } },
        })
        const initValue = { args: BigNumber(10) }
        const onchainData = lockStore.initOnChain({ lock: initValue })
        lockStore.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell({ lock: { args: onchainData.lock.args, codeHash: '', hashType: 'data' } }),
                witness: '',
              },
            },
          },
        })
        expect(lockStore.get(defaultOutpoint)).toStrictEqual({ lock: initValue })
      })
      it('add lock codehash with offset', () => {
        const lockStore = new JSONStore<{ lock: { codeHash: { offset: 10; schema: BigNumber } } }>({
          lock: { codeHash: { offset: 10 } },
        })
        const initValue = { codeHash: BigNumber(10) }
        const onchainData = lockStore.initOnChain({ lock: initValue })
        lockStore.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell({ lock: { args: '0x0', codeHash: onchainData.lock.codeHash, hashType: 'data' } }),
                witness: '',
              },
            },
          },
        })
        expect(lockStore.get(defaultOutpoint)).toStrictEqual({ lock: initValue })
      })
      it('add type without offset', () => {
        const store = new JSONStore<{ type: { args: BigNumber } }>({ type: { args: true } })
        const initValue = { args: BigNumber(1) }
        const onchainData = store.initOnChain({ type: initValue })
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell({ type: { args: onchainData.type.args, codeHash: '', hashType: 'data' } }),
                witness: '',
              },
            },
          },
        })
        expect(store.get(defaultOutpoint)).toStrictEqual({ type: initValue })
      })
      it('add type with offset', () => {
        const store = new JSONStore<{ type: { args: { offset: 10; schema: BigNumber } } }>({
          type: { args: { offset: 10 } },
        })
        const initValue = { args: BigNumber(10) }
        const onchainData = store.initOnChain({ type: initValue })
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell({ type: { args: onchainData.type.args, codeHash: '', hashType: 'data' } }),
                witness: '',
              },
            },
          },
        })
        expect(store.get(defaultOutpoint)).toStrictEqual({ type: initValue })
      })
      it('add type codehash with offset', () => {
        const store = new JSONStore<{ type: { codeHash: { offset: 10; schema: BigNumber } } }>({
          type: { codeHash: { offset: 10 } },
        })
        const initValue = { codeHash: BigNumber(10) }
        const onchainData = store.initOnChain({ type: initValue })
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell({ type: { args: '0x0', codeHash: onchainData.type.codeHash, hashType: 'data' } }),
                witness: '',
              },
            },
          },
        })
        expect(store.get(defaultOutpoint)).toStrictEqual({ type: initValue })
      })
    })

    describe('test handleCall with sub', () => {
      const store = new JSONStore<{ data: { a: BigNumber } }>({ data: true })
      beforeEach(() => {
        const initValue = { a: BigNumber(1) }
        const onchainData = store.initOnChain({ data: initValue })
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell({ data: onchainData.data }),
                witness: '',
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
            pattern: 'normal',
            value: {
              type: 'remove_cell',
              value: [defaultOutpoint],
            },
          },
        })
        expect(store.get(defaultOutpoint)).toBeUndefined()
      })
      it('remove failed', () => {
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'remove_cell',
              value: [`0x${'0'.repeat(60)}0`],
            },
          },
        })
        expect(store.get(defaultOutpoint)).toBeDefined()
      })
    })

    describe('test clone', () => {
      it('clone data and witness', () => {
        const store = new JSONStore<{ data: { a: BigNumber }; witness: { b: string } }>({ data: true, witness: true })
        const onchainData = store.initOnChain({ data: { a: BigNumber(1) }, witness: { b: 'BigNumber(20)' } })
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell({ data: onchainData.data }),
                witness: onchainData.witness,
              },
            },
          },
        })
        const cloneRes = store.clone()
        expect(cloneRes.get(defaultOutpoint) === store.get(defaultOutpoint)).toBeFalsy()
        expect(cloneRes.get(defaultOutpoint)).toStrictEqual(store.get(defaultOutpoint))
        expect(cloneRes instanceof JSONStore).toBe(true)
        expect(cloneRes.getChainData(defaultOutpoint).cell).toStrictEqual(createCell({ data: onchainData.data }))
        expect(cloneRes.getChainData(defaultOutpoint).witness).toEqual(onchainData.witness)
      })
      it('clone with lock', () => {
        const store = new JSONStore<{ lock: { args: BigNumber; codeHash: string } }>({
          lock: { args: true, codeHash: true },
        })
        const onchainData = store.initOnChain({ lock: { args: BigNumber(1), codeHash: 'codeHash' } })
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell({ lock: { ...onchainData.lock, hashType: 'type' } }),
                witness: onchainData.witness,
              },
            },
          },
        })
        const cloneRes = store.clone()
        expect(cloneRes.get(defaultOutpoint) === store.get(defaultOutpoint)).toBeFalsy()
        expect(cloneRes.get(defaultOutpoint)).toStrictEqual(store.get(defaultOutpoint))
        expect(cloneRes instanceof JSONStore).toBe(true)
        expect(cloneRes.getChainData(defaultOutpoint).cell).toStrictEqual(
          createCell({ lock: { ...onchainData.lock, hashType: 'type' } }),
        )
        expect(cloneRes.getChainData(defaultOutpoint).witness).toBeUndefined()
      })
      it('clone with type and offset', () => {
        const store = new JSONStore<{ type: { args: BigNumber; codeHash: { schema: string; offset: 10 } } }>({
          type: { args: true, codeHash: { offset: 10 } },
        })
        const onchainData = store.initOnChain({ type: { args: BigNumber(1), codeHash: 'codeHash' } })
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell({ type: { ...onchainData.type, hashType: 'type' } }),
                witness: onchainData.witness,
              },
            },
          },
        })
        const cloneRes = store.clone()
        expect(cloneRes.get(defaultOutpoint) === store.get(defaultOutpoint)).toBeFalsy()
        expect(cloneRes.get(defaultOutpoint)).toStrictEqual(store.get(defaultOutpoint))
        expect(cloneRes instanceof JSONStore).toBe(true)
        expect(cloneRes.getChainData(defaultOutpoint).cell).toStrictEqual(
          createCell({ type: { ...onchainData.type, hashType: 'type' } }),
        )
        expect(cloneRes.getChainData(defaultOutpoint).witness).toBeUndefined()
      })
    })

    describe('test get', () => {
      const store = new JSONStore<{
        data: { a: BigNumber; b: { c: BigNumber } }
        witness: boolean
        lock: { args: BigNumber; codeHash: string }
        type: { args: { a: BigNumber }; codeHash: { schema: string; offset: 20 } }
      }>({
        data: true,
        witness: true,
        lock: { args: true, codeHash: true },
        type: { args: true, codeHash: { offset: 20 } },
      })
      const initValue = {
        data: { a: BigNumber(20), b: { c: BigNumber(20) } },
        witness: false,
        lock: { args: BigNumber(10), codeHash: 'codeHash' },
        type: { args: { a: BigNumber(30) }, codeHash: 'codeHashType' },
      }
      const onchainData = store.initOnChain(initValue)
      store.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          pattern: 'normal',
          value: {
            type: 'update_cell',
            value: {
              cell: createCell({
                type: { ...onchainData.type, hashType: 'type' },
                data: onchainData.data,
                lock: { ...onchainData.lock, hashType: 'type' },
              }),
              witness: onchainData.witness,
            },
          },
        },
      })
      it('get success without path', () => {
        expect(store.get(defaultOutpoint)).toStrictEqual(initValue)
      })
      it('get success with first path data', () => {
        expect(store.get(defaultOutpoint, ['data'])).toStrictEqual(initValue.data)
      })
      it('get success with first path witness', () => {
        expect(store.get(defaultOutpoint, ['witness'])).toStrictEqual(initValue.witness)
      })
      it('get success with path data', () => {
        expect(store.get(defaultOutpoint, ['data', 'a'])).toEqual(initValue.data.a)
      })
      it('get with non existent exception no outpoint', () => {
        expect(() => store.get('0x1234', ['data', 'a111'])).toThrow(
          new NonExistentException(`0x1234:${['data', 'a111'].join('.')}`),
        )
      })
      it('get with non existent exception', () => {
        expect(() => store.get(defaultOutpoint, ['data', 'a111'])).toThrow(
          new NonExistentException(`${defaultOutpoint}:${['data', 'a111'].join('.')}`),
        )
      })
      it('get lock', () => {
        expect(store.get(defaultOutpoint, ['lock', 'args'])).toStrictEqual(initValue.lock.args)
        expect(store.get(defaultOutpoint, ['lock', 'codeHash'])).toStrictEqual(initValue.lock.codeHash)
      })
      it('get type', () => {
        expect(store.get(defaultOutpoint, ['type', 'args'])).toStrictEqual(initValue.type.args)
        expect(store.get(defaultOutpoint, ['type', 'codeHash'])).toStrictEqual(initValue.type.codeHash)
      })
    })

    describe('test set', () => {
      const store = new JSONStore<{
        data: { a: BigNumber; b: { c: BigNumber } }
        witness: boolean
        lock: { args: BigNumber; codeHash: string }
        type: { args: { a: BigNumber }; codeHash: { schema: string; offset: 20 } }
      }>({
        data: true,
        witness: true,
        lock: { args: true, codeHash: true },
        type: { args: true, codeHash: { offset: 20 } },
      })
      const initValue = {
        data: { a: BigNumber(10), b: { c: BigNumber(20) } },
        witness: false,
        lock: { args: BigNumber(30), codeHash: 'codeHash' },
        type: { args: { a: BigNumber(40) }, codeHash: 'codeHashType' },
      }
      const onchainData = store.initOnChain(initValue)
      store.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          pattern: 'normal',
          value: {
            type: 'update_cell',
            value: {
              cell: createCell({
                type: { ...onchainData.type, hashType: 'type' },
                data: onchainData.data,
                lock: { ...onchainData.lock, hashType: 'type' },
              }),
              witness: onchainData.witness,
            },
          },
        },
      })
      it('set success without path', () => {
        store.set(defaultOutpoint, {
          data: { a: BigNumber(1), b: { c: BigNumber(2) } },
          witness: true,
          lock: { args: BigNumber(3), codeHash: 'new_codeHash' },
          type: { args: { a: BigNumber(4) }, codeHash: 'new_codeHash_type' },
        })
        expect(store.get(defaultOutpoint)).toStrictEqual({
          data: { a: BigNumber(1), b: { c: BigNumber(2) } },
          witness: true,
          lock: { args: BigNumber(3), codeHash: 'new_codeHash' },
          type: { args: { a: BigNumber(4) }, codeHash: 'new_codeHash_type' },
        })
      })
      it('set success without path and no exist on chain', () => {
        expect(() =>
          store.set('0x1234', {
            data: { a: BigNumber(1), b: { c: BigNumber(2) } },
            witness: true,
            lock: { args: BigNumber(3), codeHash: 'new_codeHash' },
            type: { args: { a: BigNumber(4) }, codeHash: 'new_codeHash_type' },
          }),
        ).toThrow(new NonExistentException('0x1234'))
      })
      it('set success with data path', () => {
        store.set(defaultOutpoint, { a: BigNumber(2), b: { c: BigNumber(1) } }, ['data'])
        expect(store.get(defaultOutpoint, ['data'])).toStrictEqual({ a: BigNumber(2), b: { c: BigNumber(1) } })
      })
      it('set success with data inner path', () => {
        store.set(defaultOutpoint, { c: BigNumber(1) }, ['data', 'b'])
        expect(store.get(defaultOutpoint, ['data', 'b'])).toStrictEqual({ c: BigNumber(1) })
      })
      it('set lock args', () => {
        store.set(defaultOutpoint, BigNumber(1), ['lock', 'args'])
        expect(store.get(defaultOutpoint, ['lock', 'args'])).toStrictEqual(BigNumber(1))
      })
      it('set lock codehash', () => {
        store.set(defaultOutpoint, 'BigNumber(1)', ['lock', 'codeHash'])
        expect(store.get(defaultOutpoint, ['lock', 'codeHash'])).toStrictEqual('BigNumber(1)')
      })
      it('set type args', () => {
        store.set(defaultOutpoint, { a: BigNumber(1) }, ['type', 'args'])
        expect(store.get(defaultOutpoint, ['type', 'args'])).toStrictEqual({ a: BigNumber(1) })
      })
      it('set type codehash', () => {
        store.set(defaultOutpoint, 'BigNumber(1)', ['type', 'codeHash'])
        expect(store.get(defaultOutpoint, ['type', 'codeHash'])).toStrictEqual('BigNumber(1)')
        const onChainValue = store.initOnChain({
          ...initValue,
          type: {
            ...initValue.type,
            codeHash: 'BigNumber(1)',
          },
        })
        expect(store.getChainData(defaultOutpoint).cell.cellOutput.type?.codeHash).toStrictEqual(
          onChainValue.type.codeHash,
        )
      })
    })
  })

  describe('extend store', () => {
    it('success', () => {
      const custom = new CustomStore<{ data: string }>({ data: true })
      custom.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          pattern: 'normal',
          value: {
            type: 'update_cell',
            value: {
              cell: createCell(),
              witness: '',
            },
          },
        },
      })
      custom.clone()
      expect(serializeMock).toBeCalled()
      expect(deserializeMock).toBeCalled()
    })

    it('exception', () => {
      const custom = new NoInstanceCustomStore<{ data: string }>({ data: true })
      expect(() =>
        custom.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cell',
              value: {
                cell: createCell(),
                witness: '',
              },
            },
          },
        }),
      ).toThrow(new NonStorageInstanceException())
    })
  })
})
