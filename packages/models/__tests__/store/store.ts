import { bytes } from '@ckb-lumos/codec'
import type { Cell, HexString, Script } from '@ckb-lumos/base'
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
        expect(chainData.lockArgs).toBeUndefined()
        expect(chainData.typeArgs).toBeUndefined()
      })
      it('init with witness', () => {
        const store = new JSONStore<{ witness: { a: BigNumber } }>({ witness: true })
        const chainData = store.initOnChain({ witness: { a: BigNumber(20) } })
        const expected = bytes.hexify(new JSONStorage().serialize({ a: BigNumber(20) }))
        expect(chainData.witness).toBe(expected)
        expect(chainData.data).toBeUndefined()
        expect(chainData.lockArgs).toBeUndefined()
        expect(chainData.typeArgs).toBeUndefined()
      })
      it('init with lock', () => {
        const store = new JSONStore<{ lockArgs: BigNumber }>({
          lockArgs: true,
        })
        const chainData = store.initOnChain({ lockArgs: BigNumber(20) })
        const expectedArgs = bytes.hexify(new JSONStorage().serialize(BigNumber(20)))
        expect(chainData.lockArgs).toBe(expectedArgs)
        expect(chainData.data).toBeUndefined()
        expect(chainData.witness).toBeUndefined()
        expect(chainData.typeArgs).toBeUndefined()
      })
      it('init with type', () => {
        const store = new JSONStore<{ typeArgs: BigNumber }>({
          typeArgs: true,
        })
        const chainData = store.initOnChain({ typeArgs: BigNumber(20) })
        const expectedArgs = bytes.hexify(new JSONStorage().serialize(BigNumber(20)))
        expect(chainData.typeArgs).toBe(expectedArgs)
        expect(chainData.data).toBeUndefined()
        expect(chainData.witness).toBeUndefined()
        expect(chainData.lockArgs).toBeUndefined()
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
              type: 'update_cells',
              value: [
                {
                  cell: createCell({ data: onchainData.data }),
                  witness: '',
                },
              ],
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
              type: 'update_cells',
              value: [
                {
                  cell: createCell(),
                  witness: onchainData.witness,
                },
              ],
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
              type: 'update_cells',
              value: [
                {
                  cell: createCell({ data: store.initOnChain({ data: { a: BigNumber(1) } }).data }),
                  witness: '',
                },
              ],
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
              type: 'update_cells',
              value: [
                {
                  cell: createCell({ data: onchainData.data }),
                  witness: '',
                },
              ],
            },
          },
        })
        expect(store.get(defaultOutpoint)).toStrictEqual({ data: initValue })
      })
      it('add lock without offset', () => {
        const lockStore = new JSONStore<{ lockArgs: BigNumber }>({ lockArgs: true })
        const initValue = { lockArgs: BigNumber(1) }
        const onchainData = lockStore.initOnChain(initValue)
        lockStore.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cells',
              value: [
                {
                  cell: createCell({ lock: { args: onchainData.lockArgs, codeHash: '', hashType: 'data' } }),
                  witness: '',
                },
              ],
            },
          },
        })
        expect(lockStore.get(defaultOutpoint)).toStrictEqual(initValue)
      })
      it('add lock with offset', () => {
        const lockStore = new JSONStore<{ lockArgs: { offset: 10; schema: BigNumber } }>({
          lockArgs: { offset: 10 },
        })
        const initValue = { lockArgs: BigNumber(10) }
        const onchainData = lockStore.initOnChain(initValue)
        lockStore.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cells',
              value: [
                {
                  cell: createCell({ lock: { args: onchainData.lockArgs, codeHash: '', hashType: 'data' } }),
                  witness: '',
                },
              ],
            },
          },
        })
        expect(lockStore.get(defaultOutpoint)).toStrictEqual(initValue)
      })
      it('add type without offset', () => {
        const store = new JSONStore<{ typeArgs: BigNumber }>({ typeArgs: true })
        const initValue = { typeArgs: BigNumber(1) }
        const onchainData = store.initOnChain(initValue)
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cells',
              value: [
                {
                  cell: createCell({ type: { args: onchainData.typeArgs, codeHash: '', hashType: 'data' } }),
                  witness: '',
                },
              ],
            },
          },
        })
        expect(store.get(defaultOutpoint)).toStrictEqual(initValue)
      })
      it('add type with offset', () => {
        const store = new JSONStore<{ typeArgs: { offset: 10; schema: BigNumber } }>({
          typeArgs: { offset: 10 },
        })
        const initValue = { typeArgs: BigNumber(10) }
        const onchainData = store.initOnChain(initValue)
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cells',
              value: [
                {
                  cell: createCell({ type: { args: onchainData.typeArgs, codeHash: '', hashType: 'data' } }),
                  witness: '',
                },
              ],
            },
          },
        })
        expect(store.get(defaultOutpoint)).toStrictEqual(initValue)
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
              type: 'update_cells',
              value: [
                {
                  cell: createCell({ data: onchainData.data }),
                  witness: '',
                },
              ],
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
              type: 'update_cells',
              value: [
                {
                  cell: createCell({ data: onchainData.data }),
                  witness: onchainData.witness,
                },
              ],
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
        const store = new JSONStore<{ lockArgs: BigNumber }>({
          lockArgs: true,
        })
        const onchainData = store.initOnChain({ lockArgs: BigNumber(1) })
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cells',
              value: [
                {
                  cell: createCell({ lock: { args: onchainData.lockArgs, codeHash: '0x00', hashType: 'type' } }),
                  witness: onchainData.witness,
                },
              ],
            },
          },
        })
        const cloneRes = store.clone()
        expect(cloneRes.get(defaultOutpoint) === store.get(defaultOutpoint)).toBeFalsy()
        expect(cloneRes.get(defaultOutpoint)).toStrictEqual(store.get(defaultOutpoint))
        expect(cloneRes instanceof JSONStore).toBe(true)
        expect(cloneRes.getChainData(defaultOutpoint).cell).toStrictEqual(
          createCell({ lock: { args: onchainData.lockArgs, codeHash: '0x00', hashType: 'type' } }),
        )
        expect(cloneRes.getChainData(defaultOutpoint).witness).toBeUndefined()
      })
      it('clone with type and offset', () => {
        const store = new JSONStore<{ typeArgs: BigNumber }>({
          typeArgs: true,
        })
        const onchainData = store.initOnChain({ typeArgs: BigNumber(1) })
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'normal',
            value: {
              type: 'update_cells',
              value: [
                {
                  cell: createCell({ type: { args: onchainData.typeArgs, codeHash: '0x00', hashType: 'type' } }),
                  witness: onchainData.witness,
                },
              ],
            },
          },
        })
        const cloneRes = store.clone()
        expect(cloneRes.get(defaultOutpoint) === store.get(defaultOutpoint)).toBeFalsy()
        expect(cloneRes.get(defaultOutpoint)).toStrictEqual(store.get(defaultOutpoint))
        expect(cloneRes instanceof JSONStore).toBe(true)
        expect(cloneRes.getChainData(defaultOutpoint).cell).toStrictEqual(
          createCell({ type: { args: onchainData.typeArgs, codeHash: '0x00', hashType: 'type' } }),
        )
        expect(cloneRes.getChainData(defaultOutpoint).witness).toBeUndefined()
      })
    })

    describe('test get', () => {
      const store = new JSONStore<{
        data: { a: BigNumber; b: { c: BigNumber } }
        witness: boolean
        lockArgs: BigNumber
        typeArgs: { a: BigNumber }
      }>({
        data: true,
        witness: true,
        lockArgs: true,
        typeArgs: true,
      })
      const initValue = {
        data: { a: BigNumber(20), b: { c: BigNumber(20) } },
        witness: false,
        lockArgs: BigNumber(10),
        typeArgs: { a: BigNumber(30) },
      }
      const onchainData = store.initOnChain(initValue)
      store.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          pattern: 'normal',
          value: {
            type: 'update_cells',
            value: [
              {
                cell: createCell({
                  type: { args: onchainData.typeArgs, codeHash: '0x00', hashType: 'type' },
                  data: onchainData.data,
                  lock: { args: onchainData.lockArgs, codeHash: '0x00', hashType: 'type' },
                }),
                witness: onchainData.witness,
              },
            ],
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
        expect(store.get(defaultOutpoint, ['lockArgs'])).toStrictEqual(initValue.lockArgs)
      })
      it('get type', () => {
        expect(store.get(defaultOutpoint, ['typeArgs'])).toStrictEqual(initValue.typeArgs)
      })
    })

    describe('test set', () => {
      const store = new JSONStore<{
        data: { a: BigNumber; b: { c: BigNumber } }
        witness: boolean
        lockArgs: BigNumber
        typeArgs: { a: BigNumber }
      }>({
        data: true,
        witness: true,
        lockArgs: true,
        typeArgs: true,
      })
      const initValue = {
        data: { a: BigNumber(10), b: { c: BigNumber(20) } },
        witness: false,
        lockArgs: BigNumber(30),
        typeArgs: { a: BigNumber(40) },
      }
      const onchainData = store.initOnChain(initValue)
      store.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          pattern: 'normal',
          value: {
            type: 'update_cells',
            value: [
              {
                cell: createCell({
                  type: { args: onchainData.typeArgs, codeHash: '0x00', hashType: 'type' },
                  data: onchainData.data,
                  lock: { args: onchainData.lockArgs, codeHash: '0x00', hashType: 'type' },
                }),
                witness: onchainData.witness,
              },
            ],
          },
        },
      })
      it('set success without path', () => {
        store.set(defaultOutpoint, {
          data: { a: BigNumber(1), b: { c: BigNumber(2) } },
          witness: true,
          lockArgs: BigNumber(3),
          typeArgs: { a: BigNumber(4) },
        })
        expect(store.get(defaultOutpoint)).toStrictEqual({
          data: { a: BigNumber(1), b: { c: BigNumber(2) } },
          witness: true,
          lockArgs: BigNumber(3),
          typeArgs: { a: BigNumber(4) },
        })
      })
      it('set success without path and no exist on chain', () => {
        expect(() =>
          store.set('0x1234', {
            data: { a: BigNumber(1), b: { c: BigNumber(2) } },
            witness: true,
            lockArgs: BigNumber(3),
            typeArgs: { a: BigNumber(4) },
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
        store.set(defaultOutpoint, BigNumber(1), ['lockArgs'])
        expect(store.get(defaultOutpoint, ['lockArgs'])).toStrictEqual(BigNumber(1))
      })
      it('set type args', () => {
        store.set(defaultOutpoint, { a: BigNumber(1) }, ['typeArgs'])
        expect(store.get(defaultOutpoint, ['typeArgs'])).toStrictEqual({ a: BigNumber(1) })
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
            type: 'update_cells',
            value: [
              {
                cell: createCell(),
                witness: '',
              },
            ],
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
              type: 'update_cells',
              value: [
                {
                  cell: createCell(),
                  witness: '',
                },
              ],
            },
          },
        }),
      ).toThrow(new NonStorageInstanceException())
    })
  })

  describe('should be bound with scripts', () => {
    class StoreBoundScripts<R extends StorageSchema<CustomType>> extends Store<StorageCustom<CustomType>, R> {}
    Reflect.defineMetadata(ProviderKey.LockPattern, { codeHash: 'lock' }, StoreBoundScripts)
    Reflect.defineMetadata(ProviderKey.TypePattern, { codeHash: 'type' }, StoreBoundScripts)
    it('should bind lock script', () => {
      const store = new StoreBoundScripts({})
      expect(store.lockScript?.codeHash).toBe('lock')
    })

    it('should bind type script', () => {
      const store = new StoreBoundScripts({})
      expect(store.typeScript?.codeHash).toBe('type')
    })
  })
})
