import { bytes, molecule, number } from '@ckb-lumos/codec'
import type { Cell, HexString, OutPoint, Script } from '@ckb-lumos/base'
import { BI } from '@ckb-lumos/bi'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { NoCellToUseException, NonExistentException, NonStorageInstanceException } from '../../src/exceptions'
import {
  GetStorageStruct,
  GetStorageStructByTemplate,
  JSONStorageOffChain,
  UpdateStorageValue,
  UseLatestStrategy,
} from '../../src'
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
  ActorReference,
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

  isSimpleType(value: unknown): boolean {
    const vType = typeof value
    return vType === 'string' || vType === 'boolean' || vType === 'number' || vType === 'undefined'
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
  outPoint,
}: {
  type?: Script
  lock?: Script
  data?: HexString
  outPoint?: OutPoint
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
    outPoint: outPoint ?? defaultOutpoint,
  }
}

const createUpdateParams = (
  params: {
    type?: Script
    lock?: Script
    data?: HexString
    witness?: HexString
    outPoint?: OutPoint
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
        const store = new JSONStore<{ data: { a: string } }>({ data: true })
        const chainData = store.initOnChain({ data: { a: '20' } })
        const expected = bytes.hexify(new JSONStorage().serialize({ a: '20' }))
        expect(chainData.data).toBe(expected)
        expect(chainData.witness).toBeUndefined()
        expect(chainData.lockArgs).toBeUndefined()
        expect(chainData.typeArgs).toBeUndefined()
      })
      it('init with witness', () => {
        const store = new JSONStore<{ witness: { a: string } }>({ witness: true })
        const chainData = store.initOnChain({ witness: { a: '20' } })
        const expected = bytes.hexify(new JSONStorage().serialize({ a: '20' }))
        expect(chainData.witness).toBe(expected)
        expect(chainData.data).toBeUndefined()
        expect(chainData.lockArgs).toBeUndefined()
        expect(chainData.typeArgs).toBeUndefined()
      })
      it('init with lock', () => {
        const store = new JSONStore<{ lockArgs: string }>({
          lockArgs: true,
        })
        const chainData = store.initOnChain({ lockArgs: '20' })
        const expectedArgs = bytes.hexify(new JSONStorage().serialize('20'))
        expect(chainData.lockArgs).toBe(expectedArgs)
        expect(chainData.data).toBeUndefined()
        expect(chainData.witness).toBeUndefined()
        expect(chainData.typeArgs).toBeUndefined()
      })
      it('init with type', () => {
        const store = new JSONStore<{ typeArgs: string }>({
          typeArgs: true,
        })
        const chainData = store.initOnChain({ typeArgs: '20' })
        const expectedArgs = bytes.hexify(new JSONStorage().serialize('20'))
        expect(chainData.typeArgs).toBe(expectedArgs)
        expect(chainData.data).toBeUndefined()
        expect(chainData.witness).toBeUndefined()
        expect(chainData.lockArgs).toBeUndefined()
      })
    })

    describe('test handleCall with add', () => {
      it('add in section store', () => {
        const store = new JSONStore<{ data: { a: string } }>({ data: true })
        const initValue = { a: '1' }
        const onchainData = store.initOnChain({ data: initValue })
        const sectionStore = store.cloneSection()
        sectionStore.handleCall(createUpdateParams({ data: onchainData.data }))
        expect(sectionStore.get(defaultOutpointString)).toBeUndefined()
      })
      it('add data success', () => {
        const store = new JSONStore<{ data: { a: string } }>({ data: true })
        const initValue = { a: '1' }
        const onchainData = store.initOnChain({ data: initValue })
        store.handleCall(createUpdateParams({ data: onchainData.data }))
        expect(store.get(defaultOutpointString)).toStrictEqual({ data: initValue })
      })
      it('add witness success', () => {
        const store = new JSONStore<{ witness: { a: string } }>({ witness: true })
        const initValue = { a: '1' }
        const onchainData = store.initOnChain({ witness: initValue })
        store.handleCall(createUpdateParams({ witness: onchainData.witness }))
        expect(store.get(defaultOutpointString)).toStrictEqual({ witness: initValue })
      })
      it('add with duplicate add params', () => {
        const store = new JSONStore<{ data: { a: string } }>({ data: true })
        store.handleCall(createUpdateParams({ data: store.initOnChain({ data: { a: '1' } }).data }))
        const initValue = { a: '10' }
        const onchainData = store.initOnChain({ data: initValue })
        store.handleCall(createUpdateParams({ data: onchainData.data }))
        expect(store.get(defaultOutpointString)).toStrictEqual({ data: initValue })
      })
      it('add lock without offset', () => {
        const lockStore = new JSONStore<{ lockArgs: string }>({ lockArgs: true })
        const initValue = { lockArgs: '1' }
        const onchainData = lockStore.initOnChain(initValue)
        lockStore.handleCall(
          createUpdateParams({ lock: { args: onchainData.lockArgs, codeHash: '', hashType: 'data' } }),
        )
        expect(lockStore.get(defaultOutpointString)).toStrictEqual(initValue)
      })
      it('add lock with offset', () => {
        const lockStore = new JSONStore<{ lockArgs: { offset: 10; schema: string } }>({
          lockArgs: { offset: 10 },
        })
        const initValue = { lockArgs: '10' }
        const onchainData = lockStore.initOnChain(initValue)
        lockStore.handleCall(
          createUpdateParams({ lock: { args: onchainData.lockArgs, codeHash: '', hashType: 'data' } }),
        )
        expect(lockStore.get(defaultOutpointString)).toStrictEqual(initValue)
      })
      it('add type without offset', () => {
        const store = new JSONStore<{ typeArgs: string }>({ typeArgs: true })
        const initValue = { typeArgs: '1' }
        const onchainData = store.initOnChain(initValue)
        store.handleCall(createUpdateParams({ type: { args: onchainData.typeArgs, codeHash: '', hashType: 'data' } }))
        expect(store.get(defaultOutpointString)).toStrictEqual(initValue)
      })
      it('add type with offset', () => {
        const store = new JSONStore<{ typeArgs: { offset: 10; schema: string } }>({
          typeArgs: { offset: 10 },
        })
        const initValue = { typeArgs: '10' }
        const onchainData = store.initOnChain(initValue)
        store.handleCall(createUpdateParams({ type: { args: onchainData.typeArgs, codeHash: '', hashType: 'data' } }))
        expect(store.get(defaultOutpointString)).toStrictEqual(initValue)
      })
    })

    describe('test handleCall with sub', () => {
      const store = new JSONStore<{ data: { a: string } }>({ data: true })
      beforeEach(() => {
        const initValue = { a: '1' }
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
        const store = new JSONStore<{ data: { a: string }; witness: { b: string } }>({ data: true, witness: true })
        const onchainData = store.initOnChain({ data: { a: '1' }, witness: { b: '20' } })
        store.handleCall(createUpdateParams({ data: onchainData.data, witness: onchainData.witness }))
        const cloneRes = store.clone()
        expect(cloneRes.get(defaultOutpointString) === store.get(defaultOutpointString)).toBeFalsy()
        expect(cloneRes.get(defaultOutpointString)).toStrictEqual(store.get(defaultOutpointString))
        expect(cloneRes instanceof JSONStore).toBe(true)
        expect(cloneRes.getChainData(defaultOutpointString).cell).toStrictEqual(createCell({ data: onchainData.data }))
        expect(cloneRes.getChainData(defaultOutpointString).witness).toEqual(onchainData.witness)
      })
      it('clone with lock', () => {
        const store = new JSONStore<{ lockArgs: string }>({
          lockArgs: true,
        })
        const onchainData = store.initOnChain({ lockArgs: '1' })
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
        const store = new JSONStore<{ typeArgs: string }>({
          typeArgs: true,
        })
        const onchainData = store.initOnChain({ typeArgs: '1' })
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
        data: { a: string; b: { c: string } }
        witness: string
        lockArgs: string
        typeArgs: { a: string }
      }>({
        data: true,
        witness: true,
        lockArgs: true,
        typeArgs: true,
      })
      const initValue = {
        data: { a: '20', b: { c: '20' } },
        witness: '0',
        lockArgs: '10',
        typeArgs: { a: '30' },
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
        expect(() => store.get(defaultOutpointString, ['data', 'a111', 'a222'])).toThrow(
          new NonExistentException(`${defaultOutpointString}:${['data', 'a111', 'a222'].join('.')}`),
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
        data: { a: string; b: { c: string } }
        witness: string
        lockArgs: string
        typeArgs: { a: string }
      }>({
        data: true,
        witness: true,
        lockArgs: true,
        typeArgs: true,
      })
      const initValue = {
        data: { a: '10', b: { c: '20' } },
        witness: '0',
        lockArgs: '30',
        typeArgs: { a: '40' },
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
        const changedStore = store.set(defaultOutpointString, {
          data: { a: '1', b: { c: '2' } },
          witness: '1',
          lockArgs: '3',
          typeArgs: { a: '4' },
        })
        expect(changedStore.get(defaultOutpointString)).toStrictEqual({
          data: { a: '1', b: { c: '2' } },
          witness: '1',
          lockArgs: '3',
          typeArgs: { a: '4' },
        })
      })
      it('set success without path and no exist on chain', () => {
        expect(() =>
          store.set('0x1234', {
            data: { a: '1', b: { c: '2' } },
            witness: '1',
            lockArgs: '3',
            typeArgs: { a: '4' },
          }),
        ).toThrow(new NonExistentException('0x1234'))
      })
      it('set success with data path', () => {
        const changedStore = store.set(defaultOutpointString, ['data'], { a: '2', b: { c: '1' } })
        expect(changedStore.get(defaultOutpointString, ['data'])).toStrictEqual({
          a: '2',
          b: { c: '1' },
        })
      })
      it('set success with data inner path', () => {
        const changedStore = store.set(defaultOutpointString, ['data', 'b'], { c: '1' })
        expect(changedStore.get(defaultOutpointString, ['data', 'b'])).toStrictEqual({ c: '1' })
      })
      it('set lock args', () => {
        const changedStore = store.set(defaultOutpointString, ['lockArgs'], '1')
        expect(changedStore.get(defaultOutpointString, ['lockArgs'])).toStrictEqual('1')
      })
      it('set type args', () => {
        const changedStore = store.set(defaultOutpointString, ['typeArgs'], { a: '1' })
        expect(changedStore.get(defaultOutpointString, ['typeArgs'])).toStrictEqual({ a: '1' })
      })
    })

    describe('test merge cells data with handle call', () => {
      const initValue = { data: { a: 'a1', b: '10' } }
      it('use latest cell', () => {
        class UseLatestStore<R extends StorageSchema<JSONStorageOffChain>> extends JSONStore<R> {
          protected mergeStrategy = new UseLatestStrategy<GetStorageStruct<GetStorageStructByTemplate<R>>>()
        }
        const useLatestStore = new UseLatestStore<{ data: { a: string; b?: string } }>({ data: true })
        useLatestStore.handleCall(createUpdateParams({ data: useLatestStore.initOnChain(initValue).data }))
        useLatestStore.handleCall(
          createUpdateParams({
            data: useLatestStore.initOnChain({ data: { a: 'a2' } }).data,
            outPoint: { txHash: `0x01${'0'.repeat(62)}`, index: '0x0' },
          }),
        )
        expect(useLatestStore.get()).toStrictEqual({ data: { a: 'a2' } })
      })
      it('last cell not exist', () => {
        const store = new JSONStore<{ data: { a: string; b?: string; c?: string[] } }>({ data: true })
        store.handleCall(createUpdateParams({ data: store.initOnChain(initValue).data }))
        expect(store.get()).toStrictEqual(initValue)
      })
      it('last cell exist', () => {
        const store = new JSONStore<{ data: { a: string; b?: string; c?: string[] } }>({ data: true })
        store.handleCall(createUpdateParams({ data: store.initOnChain(initValue).data }))
        store.handleCall(
          createUpdateParams({
            data: store.initOnChain({ data: { a: 'a2' } }).data,
            outPoint: { txHash: `0x01${'0'.repeat(62)}`, index: '0x0' },
          }),
        )
        expect(store.get()).toStrictEqual({ data: { a: 'a2', b: '10' } })
      })
      it('merge array', () => {
        const store = new JSONStore<{ data: { a: string; b?: string; c?: string[] } }>({ data: true })
        store.handleCall(
          createUpdateParams({ data: store.initOnChain({ data: { a: 'a1', b: '10', c: ['1', '2'] } }).data }),
        )
        store.handleCall(
          createUpdateParams({
            data: store.initOnChain({ data: { a: 'a2', c: ['3'] } }).data,
            outPoint: { txHash: `0x01${'0'.repeat(62)}`, index: '0x0' },
          }),
        )
        expect(store.get()).toStrictEqual({ data: { a: 'a2', b: '10', c: ['3', '1', '2'] } })
      })
    })

    describe('test merge cells data with set', () => {
      const outPointTmp = { txHash: `0x01${'0'.repeat(62)}`, index: '0x0' }
      const outPointTmpString = outPointToOutPointString(outPointTmp)
      it('set use latest strategy is true', () => {
        class UseLatestStore<R extends StorageSchema<JSONStorageOffChain>> extends JSONStore<R> {
          protected mergeStrategy = new UseLatestStrategy<GetStorageStruct<GetStorageStructByTemplate<R>>>()
        }
        const useLatestStore = new UseLatestStore<{ data: { a: string; b?: string } }>({ data: true })
        useLatestStore.handleCall(
          createUpdateParams({ data: useLatestStore.initOnChain({ data: { a: 'a1', b: '1' } }).data }),
        )
        useLatestStore.handleCall(
          createUpdateParams({ data: useLatestStore.initOnChain({ data: { a: 'a2' } }).data, outPoint: outPointTmp }),
        )
        const changedStore = useLatestStore.set(['data', 'b'], '10')
        expect(changedStore.get()).toStrictEqual({ data: { a: 'a2', b: '10' } })
        // early cell not changed
        expect(changedStore.get(defaultOutpointString)).toStrictEqual({ data: { a: 'a1', b: '1' } })
        expect(changedStore.getChainData(defaultOutpointString).cell).toStrictEqual(
          createCell({ data: useLatestStore.initOnChain({ data: { a: 'a1', b: '1' } }).data }),
        )
        // changed on the latest cell
        expect(changedStore.get(outPointTmpString)).toStrictEqual({ data: { a: 'a2', b: '10' } })
        expect(changedStore.getChainData(outPointTmpString).cell).toStrictEqual(
          createCell({
            data: useLatestStore.initOnChain({ data: { a: 'a2', b: '10' } }).data,
            outPoint: outPointTmp,
          }),
        )
      })
      it('set merged data with root', () => {
        const store = new JSONStore<{ data: { a: string; b?: string; c?: string[] } }>({ data: true })
        store.handleCall(createUpdateParams({ data: store.initOnChain({ data: { a: 'a1', b: '1', c: ['1'] } }).data }))
        store.handleCall(
          createUpdateParams({ data: store.initOnChain({ data: { a: 'a2', c: ['2'] } }).data, outPoint: outPointTmp }),
        )
        const changedStore = store.set({ data: { a: 'a3', b: '20', c: ['c1', 'c2'] } })
        expect(changedStore.get(outPointTmpString)).toStrictEqual({
          data: { a: 'a3', b: '20', c: ['c1', 'c2'] },
        })
        expect(changedStore.get(defaultOutpointString)).toBeUndefined()
      })
      it('set field with type array', () => {
        const store = new JSONStore<{ data: { a: string; b?: string; c?: string[] } }>({ data: true })
        store.handleCall(createUpdateParams({ data: store.initOnChain({ data: { a: 'a1', b: '1', c: ['1'] } }).data }))
        store.handleCall(
          createUpdateParams({ data: store.initOnChain({ data: { a: 'a2', c: ['2'] } }).data, outPoint: outPointTmp }),
        )
        const changedStore = store.set(['data', 'c'], ['1', '2', '3'])
        expect(changedStore.get()).toStrictEqual({ data: { a: 'a2', b: '1', c: ['1', '2', '3'] } })
        expect(changedStore.get(outPointTmpString)).toStrictEqual({ data: { a: 'a2', c: ['1', '2', '3'] } })
        expect(changedStore.get(defaultOutpointString)).toStrictEqual({ data: { b: '1' } })
        expect(changedStore.getChainData(outPointTmpString).cell).toStrictEqual(
          createCell({
            data: store.initOnChain({ data: { a: 'a2', c: ['1', '2', '3'] } }).data,
            outPoint: outPointTmp,
          }),
        )
        expect(changedStore.getChainData(defaultOutpointString).cell).toStrictEqual(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          createCell({ data: store.initOnChain({ data: { b: '1' } as any }).data }),
        )
      })
      it('set field with type not array', () => {
        const store = new JSONStore<{ data: { a?: string; b?: string } }>({ data: true })
        store.handleCall(createUpdateParams({ data: store.initOnChain({ data: { a: 'a1', b: '1' } }).data }))
        store.handleCall(
          createUpdateParams({ data: store.initOnChain({ data: { a: 'a2' } }).data, outPoint: outPointTmp }),
        )
        const changedStore = store.set(['data', 'b'], '10').set(['data', 'a'], 'a3')
        expect(changedStore.get()).toStrictEqual({ data: { a: 'a3', b: '10' } })
        expect(changedStore.get(outPointTmpString)).toStrictEqual({ data: { a: 'a3' } })
        expect(changedStore.get(defaultOutpointString)).toStrictEqual({ data: { b: '10' } })
        expect(changedStore.getChainData(outPointTmpString).cell).toStrictEqual(
          createCell({ data: store.initOnChain({ data: { a: 'a3' } }).data, outPoint: outPointTmp }),
        )
        expect(changedStore.getChainData(defaultOutpointString).cell).toStrictEqual(
          createCell({ data: store.initOnChain({ data: { b: '10' } }).data }),
        )
      })
      it('set new field and remove old field', () => {
        const store = new JSONStore<{ data: { a: string } }>({ data: true })
        store.handleCall(createUpdateParams({ data: store.initOnChain({ data: { a: '1' } }).data }))
        store.handleCall(
          createUpdateParams({ data: store.initOnChain({ data: { a: '10' } }).data, outPoint: outPointTmp }),
        )
        const changedStore = store.set(['data', 'a'], '10').set(['data', 'a'], '20')
        expect(changedStore.get()).toStrictEqual({ data: { a: '20' } })
        expect(changedStore.get(outPointTmpString)).toStrictEqual({ data: { a: '20' } })
        expect(changedStore.get(defaultOutpointString)).toStrictEqual({ data: { a: '1' } })
        expect(changedStore.getChainData(outPointTmpString).cell).toStrictEqual(
          createCell({ data: store.initOnChain({ data: { a: '20' } }).data, outPoint: outPointTmp }),
        )
        expect(changedStore.getChainData(defaultOutpointString).cell).toStrictEqual(
          createCell({ data: store.initOnChain({ data: { a: '1' } }).data }),
        )
      })
      it('throw exception when store has no cell', () => {
        const store = new JSONStore<{ data: { a: string } }>({ data: true })
        expect(() => store.set(['data', 'a'], '20')).toThrow(new NoCellToUseException())
      })
      it('throw exception when store has no data', () => {
        const store = new JSONStore<{ data: { a: string } }>({ data: true })
        store.handleCall(createUpdateParams({ data: store.initOnChain({ data: { a: '1' } }).data }))
        expect(() => store.set(['data', 'b', 'c'], '20')).toThrow(
          new NonExistentException(`${['data', 'b', 'c'].join('.')}`),
        )
      })
    })

    describe('test getTxFromDiff', () => {
      const outPointTmp = { txHash: `0x01${'0'.repeat(62)}`, index: '0x0' }
      it('get tx when merge all cells', () => {
        const store = new JSONStore<{ data: { a: string; b?: string; c?: string[] } }>({ data: true })
        const updates = [
          createUpdateParams({ data: store.initOnChain({ data: { a: 'a1', b: '1', c: ['1'] } }).data }),
          createUpdateParams({ data: store.initOnChain({ data: { a: 'a2', c: ['2'] } }).data, outPoint: outPointTmp }),
        ]
        store.handleCall(updates[0])
        store.handleCall(updates[1])
        const changedStore = store.set({ data: { a: 'a3', b: '20', c: ['c1', 'c2'] } })
        const tx = changedStore.getTxFromDiff(store)
        expect(tx.inputs).toStrictEqual([
          (updates[0].payload.value[0] as UpdateStorageValue).cell,
          (updates[1].payload.value[0] as UpdateStorageValue).cell,
        ])
        const expectedOutput = (updates[1].payload.value[0] as UpdateStorageValue).cell
        expectedOutput.cellOutput.capacity = BI.from('0x16b969d00').add('0x16b969d00').toHexString()
        expectedOutput.data = store.initOnChain({ data: { a: 'a3', b: '20', c: ['c1', 'c2'] } }).data
        expect(tx.outputs).toStrictEqual([expectedOutput])
      })
      it('change two of three cells', () => {
        const store = new JSONStore<{ data: { a: string; b?: string; c?: { d: string } } }>({ data: true })
        const outPointTmp2 = { txHash: `0x02${'0'.repeat(62)}`, index: '0x0' }
        const updates = [
          createUpdateParams({ data: store.initOnChain({ data: { a: 'a1', c: { d: 'd1' } } }).data }),
          createUpdateParams({
            data: store.initOnChain({ data: { a: 'a2', b: '1' } }).data,
            outPoint: outPointTmp,
          }),
          createUpdateParams({ data: store.initOnChain({ data: { a: 'a2' } }).data, outPoint: outPointTmp2 }),
        ]
        store.handleCall(updates[0])
        store.handleCall(updates[1])
        store.handleCall(updates[2])
        const changedStore = store.set(['data', 'b'], '20').set(['data', 'c', 'd'], 'd2')
        const tx = changedStore.getTxFromDiff(store)
        expect(tx.inputs).toStrictEqual([
          (updates[1].payload.value[0] as UpdateStorageValue).cell,
          (updates[0].payload.value[0] as UpdateStorageValue).cell,
        ])
        const expectedOutput = [
          changedStore.getChainData(outPointToOutPointString(outPointTmp)),
          changedStore.getChainData(defaultOutpointString),
        ]
        expect(tx.outputs[0].cellOutput).toStrictEqual(expectedOutput[0].cell.cellOutput)
        expect(tx.outputs[1].cellOutput).toStrictEqual(expectedOutput[1].cell.cellOutput)
        expect(expectedOutput[0].cell.data).toBe(changedStore.initOnChain({ data: { a: 'a2', b: '20' } }).data)
        expect(expectedOutput[1].cell.data).toStrictEqual(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          changedStore.initOnChain({ data: { c: { d: 'd2' } } as any }).data,
        )
      })
    })
  })

  describe('extend store', () => {
    it('success', () => {
      const custom = new CustomStore<{ data: string }>({ data: true })
      custom.handleCall(createUpdateParams())
      custom.clone()
      expect(serializeMock).toBeCalled()
      expect(deserializeMock).toBeCalled()
    })

    it('exception', () => {
      const custom = new NoInstanceCustomStore<{ data: string }>({ data: true })
      expect(() => custom.handleCall(createUpdateParams())).toThrow(new NonStorageInstanceException())
    })
  })

  describe('should be bound with scripts', () => {
    class StoreBoundScripts<R extends StorageSchema<CustomType>> extends Store<StorageCustom<CustomType>, R> {}
    const ref = ActorReference.fromURI('local://test')
    Reflect.defineMetadata(
      ProviderKey.LockPattern,
      () => {
        return { codeHash: 'lock' }
      },
      StoreBoundScripts,
    )
    Reflect.defineMetadata(ProviderKey.TypePattern, { codeHash: 'type' }, StoreBoundScripts)
    it('should bind lock script', () => {
      const store = new StoreBoundScripts({}, { ref })
      expect(store.lockScript?.codeHash).toBe('lock')
    })

    it('should bind type script', () => {
      const store = new StoreBoundScripts({}, { ref })
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
        { options: { lockArgs: { type: 'array', value: ['Uint8', 2] } } },
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
        const store = new JSONStore<{ data: { a: string } }>({ data: true })
        const initValue = { a: '1' }
        const onchainData = store.initOnChain({ data: initValue })
        store.handleCall(createUpdateParams({ data: onchainData.data }))
        expect(store.get(defaultOutpointString)).toStrictEqual({ data: initValue })
      })
      it('add witness success', () => {
        const store = new JSONStore<{ witness: { a: string } }>({ witness: true })
        const initValue = { a: '1' }
        const onchainData = store.initOnChain({ witness: initValue })
        store.handleCall(createUpdateParams({ witness: onchainData.witness }))
        expect(store.get(defaultOutpointString)).toStrictEqual({ witness: initValue })
      })
      it('add with duplicate add params', () => {
        const store = new JSONStore<{ data: { a: string } }>({ data: true })
        store.handleCall(createUpdateParams({ data: store.initOnChain({ data: { a: '1' } }).data }))
        const initValue = { a: '10' }
        const onchainData = store.initOnChain({ data: initValue })
        store.handleCall(createUpdateParams({ data: onchainData.data }))
        expect(store.get(defaultOutpointString)).toStrictEqual({ data: initValue })
      })
      it('add lock without offset', () => {
        const lockStore = new JSONStore<{ lockArgs: string }>({ lockArgs: true })
        const initValue = { lockArgs: '1' }
        const onchainData = lockStore.initOnChain(initValue)
        lockStore.handleCall(
          createUpdateParams({ lock: { args: onchainData.lockArgs, codeHash: '', hashType: 'data' } }),
        )
        expect(lockStore.get(defaultOutpointString)).toStrictEqual(initValue)
      })
      it('add lock with offset', () => {
        const lockStore = new JSONStore<{ lockArgs: { offset: 10; schema: string } }>({
          lockArgs: { offset: 10 },
        })
        const initValue = { lockArgs: '10' }
        const onchainData = lockStore.initOnChain(initValue)
        lockStore.handleCall(
          createUpdateParams({ lock: { args: onchainData.lockArgs, codeHash: '', hashType: 'data' } }),
        )
        expect(lockStore.get(defaultOutpointString)).toStrictEqual(initValue)
      })
      it('add type without offset', () => {
        const store = new JSONStore<{ typeArgs: string }>({ typeArgs: true })
        const initValue = { typeArgs: '1' }
        const onchainData = store.initOnChain(initValue)
        store.handleCall(createUpdateParams({ type: { args: onchainData.typeArgs, codeHash: '', hashType: 'data' } }))
        expect(store.get(defaultOutpointString)).toStrictEqual(initValue)
      })
      it('add type with offset', () => {
        const store = new JSONStore<{ typeArgs: { offset: 10; schema: string } }>({
          typeArgs: { offset: 10 },
        })
        const initValue = { typeArgs: '10' }
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
        expect(() => store.get(defaultOutpointString, ['data', 'a111', 'a222'])).toThrow(
          new NonExistentException(`${defaultOutpointString}:${['data', 'a111', 'a222'].join('.')}`),
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
        const changedStore = store.set(defaultOutpointString, {
          data: 20,
          witness: BI.from(20000000000),
          lockArgs: ['arg3', 'arg4'],
          typeArgs: { a: 'a2', b: 20 },
        })
        expect(changedStore.get(defaultOutpointString)).toStrictEqual({
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
        const changedStore = store.set(defaultOutpointString, ['data'], 30)
        expect(changedStore.get(defaultOutpointString, ['data'])).toEqual(30)
      })
      it('set lock args', () => {
        const changedStore = store.set(defaultOutpointString, ['lockArgs'], ['a1', 'a2'])
        expect(changedStore.get(defaultOutpointString, ['lockArgs'])).toStrictEqual(['a1', 'a2'])
      })
      it('set type args', () => {
        const changedStore = store.set(defaultOutpointString, ['typeArgs'], { a: 'a set type', b: 40 })
        expect(changedStore.get(defaultOutpointString, ['typeArgs'])).toStrictEqual({ a: 'a set type', b: 40 })
      })
      it('set success with type args inner path', () => {
        const changedStore = store.set(defaultOutpointString, ['typeArgs', 'a'], 'set inner with path')
        expect(changedStore.get(defaultOutpointString, ['typeArgs', 'a'])).toEqual('set inner with path')
      })
    })
  })
})
