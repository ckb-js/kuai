import { bytes, molecule, number } from '@ckb-lumos/codec'
import type { Cell, HexString, Script } from '@ckb-lumos/base'
import { BI } from '@ckb-lumos/bi'
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
  MoleculeStore,
  UTF8String,
  StoreMessage,
  outPointToOutPointString,
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

const defaultOutpoint = {
  txHash: `0x${'0'.repeat(64)}`,
  index: '0x0',
}
const defaultOutpointString = outPointToOutPointString(defaultOutpoint)

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
    outPoint: defaultOutpoint,
  }
}

const createUpdateParams = (
  params: {
    type?: Script
    lock?: Script
    data?: HexString
    witness?: HexString
  } = {},
) => ({
  from: ref,
  behavior: Behavior.Call,
  payload: {
    pattern: 'update_cells',
    value: [
      {
        cell: createCell(params),
        witness: params.witness,
      },
    ] as StoreMessage,
  },
})

const createRemoveParams = (removeOutPoint?: string[]) => ({
  from: ref,
  behavior: Behavior.Call,
  payload: {
    pattern: 'remove_cells',
    value: removeOutPoint || ([defaultOutpointString] as StoreMessage),
  },
})

describe('test store', () => {
  describe('use json storage', () => {
    describe('test init chain data', () => {
      it('init with data', () => {
        const store = new JSONStore<{ data: { a: BigNumber } }>(undefined, { data: true })
        const chainData = store.initOnChain({ data: { a: BigNumber(20) } })
        const expected = bytes.hexify(new JSONStorage().serialize({ a: BigNumber(20) }))
        expect(chainData.data).toBe(expected)
        expect(chainData.witness).toBeUndefined()
        expect(chainData.lockArgs).toBeUndefined()
        expect(chainData.typeArgs).toBeUndefined()
      })
      it('init with witness', () => {
        const store = new JSONStore<{ witness: { a: BigNumber } }>(undefined, { witness: true })
        const chainData = store.initOnChain({ witness: { a: BigNumber(20) } })
        const expected = bytes.hexify(new JSONStorage().serialize({ a: BigNumber(20) }))
        expect(chainData.witness).toBe(expected)
        expect(chainData.data).toBeUndefined()
        expect(chainData.lockArgs).toBeUndefined()
        expect(chainData.typeArgs).toBeUndefined()
      })
      it('init with lock', () => {
        const store = new JSONStore<{ lockArgs: BigNumber }>(undefined, {
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
        const store = new JSONStore<{ typeArgs: BigNumber }>(undefined, {
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
        const store = new JSONStore<{ data: { a: BigNumber } }>(undefined, { data: true })
        const initValue = { a: BigNumber(1) }
        const onchainData = store.initOnChain({ data: initValue })
        store.handleCall(createUpdateParams({ data: onchainData.data }))
        expect(store.get(defaultOutpointString)).toStrictEqual({ data: initValue })
      })
      it('add witness success', () => {
        const store = new JSONStore<{ witness: { a: BigNumber } }>(undefined, { witness: true })
        const initValue = { a: BigNumber(1) }
        const onchainData = store.initOnChain({ witness: initValue })
        store.handleCall(createUpdateParams({ witness: onchainData.witness }))
        expect(store.get(defaultOutpointString)).toStrictEqual({ witness: initValue })
      })
      it('add with duplicate add params', () => {
        const store = new JSONStore<{ data: { a: BigNumber } }>({ data: true })
        store.handleCall({
          from: ref,
          behavior: Behavior.Call,
          payload: {
            pattern: 'update_cells',
            value: [
              {
                cell: createCell({ data: store.initOnChain({ data: { a: BigNumber(1) } }).data }),
                witness: '',
              },
            ],
          },
        })
        const initValue = { a: BigNumber(10) }
        const onchainData = store.initOnChain({ data: initValue })
        store.handleCall(createUpdateParams({ data: onchainData.data }))
        expect(store.get(defaultOutpointString)).toStrictEqual({ data: initValue })
      })
      it('add lock without offset', () => {
        const lockStore = new JSONStore<{ lockArgs: BigNumber }>(undefined, { lockArgs: true })
        const initValue = { lockArgs: BigNumber(1) }
        const onchainData = lockStore.initOnChain(initValue)
        lockStore.handleCall(
          createUpdateParams({ lock: { args: onchainData.lockArgs, codeHash: '', hashType: 'data' } }),
        )
        expect(lockStore.get(defaultOutpointString)).toStrictEqual(initValue)
      })
      it('add lock with offset', () => {
        const lockStore = new JSONStore<{ lockArgs: { offset: 10; schema: BigNumber } }>(undefined, {
          lockArgs: { offset: 10 },
        })
        const initValue = { lockArgs: BigNumber(10) }
        const onchainData = lockStore.initOnChain(initValue)
        lockStore.handleCall(
          createUpdateParams({ lock: { args: onchainData.lockArgs, codeHash: '', hashType: 'data' } }),
        )
        expect(lockStore.get(defaultOutpointString)).toStrictEqual(initValue)
      })
      it('add type without offset', () => {
        const store = new JSONStore<{ typeArgs: BigNumber }>(undefined, { typeArgs: true })
        const initValue = { typeArgs: BigNumber(1) }
        const onchainData = store.initOnChain(initValue)
        store.handleCall(createUpdateParams({ type: { args: onchainData.typeArgs, codeHash: '', hashType: 'data' } }))
        expect(store.get(defaultOutpointString)).toStrictEqual(initValue)
      })
      it('add type with offset', () => {
        const store = new JSONStore<{ typeArgs: { offset: 10; schema: BigNumber } }>(undefined, {
          typeArgs: { offset: 10 },
        })
        const initValue = { typeArgs: BigNumber(10) }
        const onchainData = store.initOnChain(initValue)
        store.handleCall(createUpdateParams({ type: { args: onchainData.typeArgs, codeHash: '', hashType: 'data' } }))
        expect(store.get(defaultOutpointString)).toStrictEqual(initValue)
      })
    })

    describe('test handleCall with sub', () => {
      const store = new JSONStore<{ data: { a: BigNumber } }>(undefined, { data: true })
      beforeEach(() => {
        const initValue = { a: BigNumber(1) }
        const onchainData = store.initOnChain({ data: initValue })
        store.handleCall(createUpdateParams({ data: onchainData.data }))
      })
      it('remove success', () => {
        store.handleCall(createRemoveParams())
        expect(store.get(defaultOutpointString)).toBeUndefined()
      })
      it('remove failed', () => {
        store.handleCall(createRemoveParams([`0x${'0'.repeat(60)}0`]))
        expect(store.get(defaultOutpointString)).toBeDefined()
      })
    })

    describe('test clone', () => {
      it('clone data and witness', () => {
        const store = new JSONStore<{ data: { a: BigNumber }; witness: { b: string } }>(undefined, {
          data: true,
          witness: true,
        })
        const onchainData = store.initOnChain({ data: { a: BigNumber(1) }, witness: { b: 'BigNumber(20)' } })
        store.handleCall(createUpdateParams({ data: onchainData.data, witness: onchainData.witness }))
        const cloneRes = store.clone()
        expect(cloneRes.get(defaultOutpoint) === store.get(defaultOutpoint)).toBeFalsy()
        expect(cloneRes.get(defaultOutpoint)).toStrictEqual(store.get(defaultOutpoint))
        expect(cloneRes instanceof JSONStore).toBe(true)
        expect(cloneRes.getChainData(defaultOutpointString).cell).toStrictEqual(createCell({ data: onchainData.data }))
        expect(cloneRes.getChainData(defaultOutpointString).witness).toEqual(onchainData.witness)
      })
      it('clone with lock', () => {
        const store = new JSONStore<{ lockArgs: BigNumber }>(undefined, {
          lockArgs: true,
        })
        const onchainData = store.initOnChain({ lockArgs: BigNumber(1) })
        store.handleCall(
          createUpdateParams({ lock: { args: onchainData.lockArgs, codeHash: '0x00', hashType: 'type' } }),
        )
        const cloneRes = store.clone()
        expect(cloneRes.get(defaultOutpointString) === store.get(defaultOutpointString)).toBeFalsy()
        expect(cloneRes.get(defaultOutpointString)).toStrictEqual(store.get(defaultOutpointString))
        expect(cloneRes instanceof JSONStore).toBe(true)
        expect(cloneRes.getChainData(defaultOutpointString).cell).toStrictEqual(
          createCell({ lock: { args: onchainData.lockArgs, codeHash: '0x00', hashType: 'type' } }),
        )
        expect(cloneRes.getChainData(defaultOutpointString).witness).toBeUndefined()
      })
      it('clone with type and offset', () => {
        const store = new JSONStore<{ typeArgs: BigNumber }>(undefined, {
          typeArgs: true,
        })
        const onchainData = store.initOnChain({ typeArgs: BigNumber(1) })
        store.handleCall(
          createUpdateParams({ type: { args: onchainData.typeArgs, codeHash: '0x00', hashType: 'type' } }),
        )
        const cloneRes = store.clone()
        expect(cloneRes.get(defaultOutpointString) === store.get(defaultOutpointString)).toBeFalsy()
        expect(cloneRes.get(defaultOutpointString)).toStrictEqual(store.get(defaultOutpointString))
        expect(cloneRes instanceof JSONStore).toBe(true)
        expect(cloneRes.getChainData(defaultOutpointString).cell).toStrictEqual(
          createCell({ type: { args: onchainData.typeArgs, codeHash: '0x00', hashType: 'type' } }),
        )
        expect(cloneRes.getChainData(defaultOutpointString).witness).toBeUndefined()
      })
    })

    describe('test get', () => {
      const store = new JSONStore<{
        data: { a: BigNumber; b: { c: BigNumber } }
        witness: boolean
        lockArgs: BigNumber
        typeArgs: { a: BigNumber }
      }>(undefined, {
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
      store.handleCall(
        createUpdateParams({
          type: { args: onchainData.typeArgs, codeHash: '0x00', hashType: 'type' },
          data: onchainData.data,
          lock: { args: onchainData.lockArgs, codeHash: '0x00', hashType: 'type' },
          witness: onchainData.witness,
        }),
      )
      it('get success without path', () => {
        expect(store.get(defaultOutpointString)).toStrictEqual(initValue)
      })
      it('get success with first path data', () => {
        expect(store.get(defaultOutpointString, ['data'])).toStrictEqual(initValue.data)
      })
      it('get success with first path witness', () => {
        expect(store.get(defaultOutpointString, ['witness'])).toStrictEqual(initValue.witness)
      })
      it('get success with path data', () => {
        expect(store.get(defaultOutpointString, ['data', 'a'])).toEqual(initValue.data.a)
      })
      it('get with non existent exception no outpoint', () => {
        expect(() => store.get('0x1234', ['data', 'a111'])).toThrow(
          new NonExistentException(`0x1234:${['data', 'a111'].join('.')}`),
        )
      })
      it('get with non existent exception', () => {
        expect(() => store.get(defaultOutpointString, ['data', 'a111'])).toThrow(
          new NonExistentException(`${defaultOutpointString}:${['data', 'a111'].join('.')}`),
        )
      })
      it('get lock', () => {
        expect(store.get(defaultOutpointString, ['lockArgs'])).toStrictEqual(initValue.lockArgs)
      })
      it('get type', () => {
        expect(store.get(defaultOutpointString, ['typeArgs'])).toStrictEqual(initValue.typeArgs)
      })
    })

    describe('test set', () => {
      const store = new JSONStore<{
        data: { a: BigNumber; b: { c: BigNumber } }
        witness: boolean
        lockArgs: BigNumber
        typeArgs: { a: BigNumber }
      }>(undefined, {
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
      store.handleCall(
        createUpdateParams({
          type: { args: onchainData.typeArgs, codeHash: '0x00', hashType: 'type' },
          data: onchainData.data,
          lock: { args: onchainData.lockArgs, codeHash: '0x00', hashType: 'type' },
          witness: onchainData.witness,
        }),
      )
      it('set success without path', () => {
        store.set(defaultOutpointString, {
          data: { a: BigNumber(1), b: { c: BigNumber(2) } },
          witness: true,
          lockArgs: BigNumber(3),
          typeArgs: { a: BigNumber(4) },
        })
        expect(store.get(defaultOutpointString)).toStrictEqual({
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
        store.set(defaultOutpointString, { a: BigNumber(2), b: { c: BigNumber(1) } }, ['data'])
        expect(store.get(defaultOutpointString, ['data'])).toStrictEqual({ a: BigNumber(2), b: { c: BigNumber(1) } })
      })
      it('set success with data inner path', () => {
        store.set(defaultOutpointString, { c: BigNumber(1) }, ['data', 'b'])
        expect(store.get(defaultOutpointString, ['data', 'b'])).toStrictEqual({ c: BigNumber(1) })
      })
      it('set lock args', () => {
        store.set(defaultOutpointString, BigNumber(1), ['lockArgs'])
        expect(store.get(defaultOutpointString, ['lockArgs'])).toStrictEqual(BigNumber(1))
      })
      it('set type args', () => {
        store.set(defaultOutpointString, { a: BigNumber(1) }, ['typeArgs'])
        expect(store.get(defaultOutpointString, ['typeArgs'])).toStrictEqual({ a: BigNumber(1) })
      })
    })
  })

  describe('test load', () => {
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
        pattern: 'update_cells',
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
    })
    it('load all success without path', () => {
      expect(store.load()).toStrictEqual(initValue)
    })
    it('load data success path', () => {
      expect(store.load('data')).toStrictEqual(initValue.data)
    })
    it('load witness success with first path witness', () => {
      expect(store.load('witness')).toStrictEqual(initValue.witness)
    })
    it('load sub path success', () => {
      expect(store.load('data.a')).toEqual(initValue.data.a)
    })
    it('load non-existent value returns null', () => {
      expect(store.load('data.a111')).toBeNull()
    })
    it('load lock', () => {
      expect(store.load('lockArgs')).toStrictEqual(initValue.lockArgs)
    })
    it('load type', () => {
      expect(store.load('typeArgs')).toStrictEqual(initValue.typeArgs)
    })
    // TODO: add tests of data combination
  })

  describe('extend store', () => {
    it('success', () => {
      const custom = new CustomStore<{ data: string }>({ data: true })
      custom.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          pattern: 'update_cells',
          value: [
            {
              cell: createCell(),
              witness: '',
            },
          ],
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
            pattern: 'update_cells',
            value: [
              {
                cell: createCell(),
                witness: '',
              },
            ],
          },
        }),
      ).toThrow(new NonStorageInstanceException())
    })
  })

  describe('should be bound with scripts', () => {
    class StoreBoundScripts<R extends StorageSchema<CustomType>> extends Store<StorageCustom<CustomType>, R> {}
    const ref = ActorReference.fromURI('local://test')
    Reflect.defineMetadata(ProviderKey.LockPattern, { codeHash: 'lock' }, StoreBoundScripts, ref.uri)
    Reflect.defineMetadata(ProviderKey.TypePattern, { codeHash: 'type' }, StoreBoundScripts, ref.uri)
    it('should bind lock script', () => {
      const store = new StoreBoundScripts(ref, {})
      expect(store.lockScript?.codeHash).toBe('lock')
    })

    it('should bind type script', () => {
      const store = new StoreBoundScripts(ref, {})
      expect(store.typeScript?.codeHash).toBe('type')
    })
  })

  describe('test store with molecule storage', () => {
    describe('test with data', () => {
      const store = new MoleculeStore<{ data: 'Uint8' }>({ data: true }, { options: { data: 'Uint8' } })
      const initValue = { data: 10 }
      const chainData = store.initOnChain(initValue)
      it('init with data', () => {
        const expected = bytes.hexify(number.Uint8.pack(initValue.data))
        expect(chainData.data).toBe(expected)
        expect(chainData.witness).toBeUndefined()
        expect(chainData.lockArgs).toBeUndefined()
        expect(chainData.typeArgs).toBeUndefined()
      })
      it('add data success with handleCall', () => {
        store.handleCall(createUpdateParams({ data: chainData.data }))
        expect(store.get(defaultOutpointString)).toStrictEqual(initValue)
      })
    })

    describe('test with witness', () => {
      const store = new MoleculeStore<{ witness: 'string' }>({ witness: true }, { options: { witness: 'string' } })
      const initValue = { witness: 'data' }
      const chainData = store.initOnChain(initValue)
      it('init with data', () => {
        const expected = bytes.hexify(UTF8String.pack(initValue.witness))
        expect(chainData.witness).toBe(expected)
        expect(chainData.data).toBeUndefined()
        expect(chainData.lockArgs).toBeUndefined()
        expect(chainData.typeArgs).toBeUndefined()
      })
      it('add data success with handleCall', () => {
        store.handleCall(createUpdateParams({ witness: chainData.witness }))
        expect(store.get(defaultOutpointString)).toStrictEqual(initValue)
      })
    })

    describe('test with lockArgs', () => {
      const store = new MoleculeStore<{ lockArgs: { type: 'array'; value: ['Uint8', 2] } }>(
        { lockArgs: true },
        { options: { lockArgs: { type: 'array', value: ['Uint8', 'Uint8'] } } },
      )
      const initValue: { lockArgs: [number, number] } = { lockArgs: [10, 20] }
      const chainData = store.initOnChain(initValue)
      it('init with lockArgs', () => {
        const expected = bytes.hexify(molecule.array(number.Uint8, 2).pack(initValue.lockArgs))
        expect(chainData.lockArgs).toBe(expected)
        expect(chainData.witness).toBeUndefined()
        expect(chainData.data).toBeUndefined()
        expect(chainData.typeArgs).toBeUndefined()
      })
      it('add data success with handleCall', () => {
        store.handleCall(createUpdateParams({ lock: { args: chainData.lockArgs, codeHash: '0x00', hashType: 'type' } }))
        expect(store.get(defaultOutpointString)).toStrictEqual(initValue)
      })
    })

    describe('test with typeArgs', () => {
      const store = new MoleculeStore<{ typeArgs: { type: 'table'; value: { a: 'Uint8'; b: 'string' } } }>(
        { typeArgs: true },
        { options: { typeArgs: { type: 'table', value: { a: 'Uint8', b: 'string' } } } },
      )
      const initValue = { typeArgs: { a: 10, b: 'b1' } }
      const chainData = store.initOnChain(initValue)
      it('init with typeArgs', () => {
        const expected = bytes.hexify(
          molecule.table({ a: number.Uint8, b: UTF8String }, ['a', 'b']).pack(initValue.typeArgs),
        )
        expect(chainData.typeArgs).toBe(expected)
        expect(chainData.witness).toBeUndefined()
        expect(chainData.lockArgs).toBeUndefined()
        expect(chainData.data).toBeUndefined()
      })
      it('add data success with handleCall', () => {
        store.handleCall(createUpdateParams({ type: { args: chainData.typeArgs, codeHash: '0x00', hashType: 'type' } }))
        expect(store.get(defaultOutpointString)).toStrictEqual(initValue)
      })
    })

    describe('test handleCall with add', () => {
      it('add data success', () => {
        const store = new JSONStore<{ data: { a: BigNumber } }>({ data: true })
        const initValue = { a: BigNumber(1) }
        const onchainData = store.initOnChain({ data: initValue })
        store.handleCall(createUpdateParams({ data: onchainData.data }))
        expect(store.get(defaultOutpointString)).toStrictEqual({ data: initValue })
      })
      it('add witness success', () => {
        const store = new JSONStore<{ witness: { a: BigNumber } }>({ witness: true })
        const initValue = { a: BigNumber(1) }
        const onchainData = store.initOnChain({ witness: initValue })
        store.handleCall(createUpdateParams({ witness: onchainData.witness }))
        expect(store.get(defaultOutpointString)).toStrictEqual({ witness: initValue })
      })
      it('add with duplicate add params', () => {
        const store = new JSONStore<{ data: { a: BigNumber } }>({ data: true })
        store.handleCall(createUpdateParams({ data: store.initOnChain({ data: { a: BigNumber(1) } }).data }))
        const initValue = { a: BigNumber(10) }
        const onchainData = store.initOnChain({ data: initValue })
        store.handleCall(createUpdateParams({ data: onchainData.data }))
        expect(store.get(defaultOutpointString)).toStrictEqual({ data: initValue })
      })
      it('add lock without offset', () => {
        const lockStore = new JSONStore<{ lockArgs: BigNumber }>({ lockArgs: true })
        const initValue = { lockArgs: BigNumber(1) }
        const onchainData = lockStore.initOnChain(initValue)
        lockStore.handleCall(
          createUpdateParams({ lock: { args: onchainData.lockArgs, codeHash: '', hashType: 'data' } }),
        )
        expect(lockStore.get(defaultOutpointString)).toStrictEqual(initValue)
      })
      it('add lock with offset', () => {
        const lockStore = new JSONStore<{ lockArgs: { offset: 10; schema: BigNumber } }>({
          lockArgs: { offset: 10 },
        })
        const initValue = { lockArgs: BigNumber(10) }
        const onchainData = lockStore.initOnChain(initValue)
        lockStore.handleCall(
          createUpdateParams({ lock: { args: onchainData.lockArgs, codeHash: '', hashType: 'data' } }),
        )
        expect(lockStore.get(defaultOutpointString)).toStrictEqual(initValue)
      })
      it('add type without offset', () => {
        const store = new JSONStore<{ typeArgs: BigNumber }>({ typeArgs: true })
        const initValue = { typeArgs: BigNumber(1) }
        const onchainData = store.initOnChain(initValue)
        store.handleCall(createUpdateParams({ type: { args: onchainData.typeArgs, codeHash: '', hashType: 'data' } }))
        expect(store.get(defaultOutpointString)).toStrictEqual(initValue)
      })
      it('add type with offset', () => {
        const store = new JSONStore<{ typeArgs: { offset: 10; schema: BigNumber } }>({
          typeArgs: { offset: 10 },
        })
        const initValue = { typeArgs: BigNumber(10) }
        const onchainData = store.initOnChain(initValue)
        store.handleCall(createUpdateParams({ type: { args: onchainData.typeArgs, codeHash: '', hashType: 'data' } }))
        expect(store.get(defaultOutpointString)).toStrictEqual(initValue)
      })
    })

    describe('test handleCall with sub', () => {
      const store = new MoleculeStore<{ data: { type: 'vec'; value: 'Uint8' } }>(
        { data: true },
        { options: { data: { type: 'vec', value: 'Uint8' } } },
      )
      const initValue = { data: [10, 20, 30, 40] }
      const chainData = store.initOnChain(initValue)
      beforeEach(() => {
        store.handleCall(createUpdateParams({ data: chainData.data }))
      })
      it('remove success', () => {
        store.handleCall(createRemoveParams())
        expect(store.get(defaultOutpointString)).toBeUndefined()
      })
      it('remove failed', () => {
        store.handleCall(createRemoveParams([`0x${'0'.repeat(60)}0`]))
        expect(store.get(defaultOutpointString)).toStrictEqual(initValue)
      })
    })

    describe('test clone', () => {
      it('clone data and witness', () => {
        const store = new MoleculeStore<{
          data: { type: 'struct'; value: { type: 'Uint8'; b: 'Uint16' } }
          witness: { type: 'option'; value: 'string' }
        }>(
          { data: true, witness: true },
          {
            options: {
              data: { type: 'struct', value: { type: 'Uint8', b: 'Uint16' } },
              witness: { type: 'option', value: 'string' },
            },
          },
        )
        const initData = { data: { type: 12, b: 300 }, witness: 'witness' }
        const onchainData = store.initOnChain(initData)
        store.handleCall(createUpdateParams({ data: onchainData.data, witness: onchainData.witness }))
        const cloneRes = store.clone()
        expect(cloneRes.get(defaultOutpointString) === store.get(defaultOutpointString)).toBeFalsy()
        expect(cloneRes.get(defaultOutpointString)).toStrictEqual(store.get(defaultOutpointString))
        expect(cloneRes instanceof MoleculeStore).toBe(true)
        expect(cloneRes.getChainData(defaultOutpointString).cell).toStrictEqual(createCell({ data: onchainData.data }))
        expect(cloneRes.getChainData(defaultOutpointString).witness).toEqual(onchainData.witness)
      })
      it('clone with lock', () => {
        const store = new MoleculeStore<{ lockArgs: { type: 'union'; value: { a: 'Uint8'; b: 'string' } } }>(
          { lockArgs: true },
          { options: { lockArgs: { type: 'union', value: { a: 'Uint8', b: 'string' } } } },
        )
        const onchainData = store.initOnChain({ lockArgs: { a: 10 } })
        store.handleCall(
          createUpdateParams({ lock: { args: onchainData.lockArgs, codeHash: '0x00', hashType: 'type' } }),
        )
        const cloneRes = store.clone()
        expect(cloneRes.get(defaultOutpointString) === store.get(defaultOutpointString)).toBeFalsy()
        expect(cloneRes.get(defaultOutpointString)).toStrictEqual(store.get(defaultOutpointString))
        expect(cloneRes instanceof MoleculeStore).toBe(true)
        expect(cloneRes.getChainData(defaultOutpointString).cell).toStrictEqual(
          createCell({ lock: { args: onchainData.lockArgs, codeHash: '0x00', hashType: 'type' } }),
        )
        expect(cloneRes.getChainData(defaultOutpointString).witness).toBeUndefined()
      })
      it('clone with type and offset', () => {
        const store = new MoleculeStore<{
          typeArgs: { offset: 10; schema: { type: 'union'; value: { a: 'Uint8'; b: 'string' } } }
        }>(
          { typeArgs: { offset: 10 } },
          { options: { typeArgs: { type: 'union', value: { a: 'Uint8', b: 'string' } } } },
        )
        const onchainData = store.initOnChain({ typeArgs: { b: 'b1' } })
        store.handleCall(
          createUpdateParams({ type: { args: onchainData.typeArgs, codeHash: '0x00', hashType: 'type' } }),
        )
        const cloneRes = store.clone()
        expect(cloneRes.get(defaultOutpointString) === store.get(defaultOutpointString)).toBeFalsy()
        expect(cloneRes.get(defaultOutpointString)).toStrictEqual(store.get(defaultOutpointString))
        expect(cloneRes instanceof MoleculeStore).toBe(true)
        expect(cloneRes.getChainData(defaultOutpointString).cell).toStrictEqual(
          createCell({ type: { args: onchainData.typeArgs, codeHash: '0x00', hashType: 'type' } }),
        )
        expect(cloneRes.getChainData(defaultOutpointString).witness).toBeUndefined()
      })
    })

    describe('test get', () => {
      const store = new MoleculeStore<{
        data: 'Uint8'
        witness: 'Uint128'
        lockArgs: { type: 'option'; value: { type: 'vec'; value: 'string' } }
        typeArgs: { type: 'table'; value: { a: 'string'; b: 'Uint8' } }
      }>(
        {
          data: true,
          witness: true,
          lockArgs: true,
          typeArgs: true,
        },
        {
          options: {
            data: 'Uint8',
            witness: 'Uint128',
            lockArgs: { type: 'option', value: { type: 'vec', value: 'string' } },
            typeArgs: { type: 'table', value: { a: 'string', b: 'Uint8' } },
          },
        },
      )
      const initValue = {
        data: 10,
        witness: BI.from(1000000000),
        lockArgs: ['arg1', 'arg2'],
        typeArgs: { a: 'a1', b: 10 },
      }
      const onchainData = store.initOnChain(initValue)
      store.handleCall(
        createUpdateParams({
          type: { args: onchainData.typeArgs, codeHash: '0x00', hashType: 'type' },
          data: onchainData.data,
          lock: { args: onchainData.lockArgs, codeHash: '0x00', hashType: 'type' },
          witness: onchainData.witness,
        }),
      )
      it('get success without path', () => {
        expect(store.get(defaultOutpointString)).toStrictEqual(initValue)
      })
      it('get success with first path data', () => {
        expect(store.get(defaultOutpointString, ['data'])).toStrictEqual(initValue.data)
      })
      it('get success with first path witness', () => {
        expect(store.get(defaultOutpointString, ['witness'])).toStrictEqual(initValue.witness)
      })
      it('get with non existent exception no outpoint', () => {
        expect(() => store.get('0x1234', ['data', 'a111'])).toThrow(
          new NonExistentException(`0x1234:${['data', 'a111'].join('.')}`),
        )
      })
      it('get with non existent exception', () => {
        expect(() => store.get(defaultOutpointString, ['data', 'a111'])).toThrow(
          new NonExistentException(`${defaultOutpointString}:${['data', 'a111'].join('.')}`),
        )
      })
      it('get lock', () => {
        expect(store.get(defaultOutpointString, ['lockArgs'])).toStrictEqual(initValue.lockArgs)
      })
      it('get type', () => {
        expect(store.get(defaultOutpointString, ['typeArgs'])).toStrictEqual(initValue.typeArgs)
      })
      it('get success with path typeArgs', () => {
        expect(store.get(defaultOutpointString, ['typeArgs', 'a'])).toEqual(initValue.typeArgs.a)
      })
    })

    describe('test set', () => {
      const store = new MoleculeStore<{
        data: 'Uint8'
        witness: 'Uint128'
        lockArgs: { offset: 10; schema: { type: 'option'; value: { type: 'vec'; value: 'string' } } }
        typeArgs: { offset: 20; schema: { type: 'table'; value: { a: 'string'; b: 'Uint8' } } }
      }>(
        {
          data: true,
          witness: true,
          lockArgs: { offset: 10 },
          typeArgs: { offset: 20 },
        },
        {
          options: {
            data: 'Uint8',
            witness: 'Uint128',
            lockArgs: { type: 'option', value: { type: 'vec', value: 'string' } },
            typeArgs: { type: 'table', value: { a: 'string', b: 'Uint8' } },
          },
        },
      )
      const initValue = {
        data: 10,
        witness: BI.from(1000000000),
        lockArgs: ['arg1', 'arg2'],
        typeArgs: { a: 'a1', b: 10 },
      }
      const onchainData = store.initOnChain(initValue)
      store.handleCall(
        createUpdateParams({
          type: { args: onchainData.typeArgs, codeHash: '0x00', hashType: 'type' },
          data: onchainData.data,
          lock: { args: onchainData.lockArgs, codeHash: '0x00', hashType: 'type' },
          witness: onchainData.witness,
        }),
      )
      it('set success without path', () => {
        store.set(defaultOutpointString, {
          data: 20,
          witness: BI.from(20000000000),
          lockArgs: ['arg3', 'arg4'],
          typeArgs: { a: 'a2', b: 20 },
        })
        expect(store.get(defaultOutpointString)).toStrictEqual({
          data: 20,
          witness: BI.from(20000000000),
          lockArgs: ['arg3', 'arg4'],
          typeArgs: { a: 'a2', b: 20 },
        })
      })
      it('set success without path and no exist on chain', () => {
        expect(() =>
          store.set('0x1234', {
            data: 20,
            witness: BI.from(20000000000),
            lockArgs: ['arg3', 'arg4'],
            typeArgs: { a: 'a2', b: 20 },
          }),
        ).toThrow(new NonExistentException('0x1234'))
      })
      it('set success with data path', () => {
        store.set(defaultOutpointString, 30, ['data'])
        expect(store.get(defaultOutpointString, ['data'])).toEqual(30)
      })
      it('set lock args', () => {
        store.set(defaultOutpointString, ['a1', 'a2'], ['lockArgs'])
        expect(store.get(defaultOutpointString, ['lockArgs'])).toStrictEqual(['a1', 'a2'])
      })
      it('set type args', () => {
        store.set(defaultOutpointString, { a: 'a set type', b: 40 }, ['typeArgs'])
        expect(store.get(defaultOutpointString, ['typeArgs'])).toStrictEqual({ a: 'a set type', b: 40 })
      })
      it('set success with type args inner path', () => {
        store.set(defaultOutpointString, 'set inner with path', ['typeArgs', 'a'])
        expect(store.get(defaultOutpointString, ['typeArgs', 'a'])).toEqual('set inner with path')
      })
    })
  })
})
