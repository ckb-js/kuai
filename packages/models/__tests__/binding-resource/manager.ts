import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { ProviderKey, Behavior, outpointToOutPointString } from '../../src'
import { Manager } from '../../src'
import { utils, Input, Output } from '@ckb-lumos/base'

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const mockXRead = jest.fn<() => any>()
const mockXAdd = jest.fn()
jest.mock('ioredis', () => {
  return class Redis {
    xread = mockXRead
    xadd = mockXAdd
  }
})

const ref = {
  name: 'store',
  protocol: 'local',
  path: '/',
  uri: 'local://store',
}

Reflect.defineMetadata(
  ProviderKey.Actor,
  {
    ref: {
      name: 'resource',
      path: '',
      protocal: 'local',
      uri: 'local://resource',
    },
  },
  Manager,
)

describe('Test resource binding', () => {
  describe('test handleCall with register', () => {
    it('register success', () => {
      const manager = new Manager()
      manager.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          pattern: 'normal',
          value: {
            type: 'register',
            register: {
              typescriptHash: '0x11',
              lockscriptHash: '0x22',
              uri: ref.uri,
            },
          },
        },
      })
      expect(manager.registry.get('0x11')?.get('0x22')).toEqual({ uri: ref.uri })
      expect(manager.registryReverse.get(ref.uri)).toEqual(['0x11', '0x22'])
    })
  })
  describe('test handleCall with revoke', () => {
    it('revoke success', () => {
      const manager = new Manager()
      manager.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          pattern: 'normal',
          value: {
            type: 'register',
            register: {
              typescriptHash: '0x11',
              lockscriptHash: '0x22',
              uri: ref.uri,
            },
          },
        },
      })
      manager.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          pattern: 'normal',
          value: {
            type: 'revoke',
            revoke: {
              uri: ref.uri,
            },
          },
        },
      })
      expect(manager.registry.get('0x11')?.get('0x22')).toBeUndefined()
      expect(manager.registryReverse.get(ref.uri)).toBeUndefined()
    })
  })
  describe('test update store when latest block arrived', () => {
    const manager = new Manager()

    afterEach(() => {
      mockXAdd.mockClear()
    })

    it('cell update success', () => {
      const output: Output = {
        capacity: '0x01',
        lock: {
          codeHash: '0x3714af858b8b82b2bb8f13d51f3cffede2dd8d352a6938334bb79e6b845e3658',
          hashType: 'type',
          args: '0x01',
        },
        type: {
          codeHash: '0x5e7a36a77e68eecc013dfa2fe6a23f3b6c344b04005808694ae6dd45eea4cfd5',
          hashType: 'type',
          args: '0x01',
        },
      }
      const mockBlock = {
        header: {
          timestamp: '0x',
          number: '0x01',
          epoch: '0x',
          compactTarget: '0x',
          dao: '0x',
          hash: '0x',
          nonce: '0x',
          parentHash: '0x',
          proposalsHash: '0x',
          transactionsRoot: '0x',
          extraHash: '0x',
          version: '0x',
        },
        transactions: [
          {
            cellDeps: [],
            hash: '0x01',
            headerDeps: [],
            inputs: [],
            outputs: [output],
            outputsData: ['0x01'],
            version: '0x01',
            witnesses: ['0x01'],
          },
        ],
        uncles: [],
        proposals: [],
      }
      /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
      manager.register(utils.computeScriptHash(output.lock), utils.computeScriptHash(output.type!), ref.uri)
      manager.onListenBlock(mockBlock)
      expect(mockXAdd).toBeCalled()
      expect(manager.lastBlock?.header.number).toEqual('0x01')
      expect(
        manager.registryOutpoint.get(
          outpointToOutPointString({
            txHash: '0x01',
            index: '0x00',
          }),
        ),
      ).toEqual({ uri: ref.uri })
    })

    it('cell remove success', () => {
      const output: Output = {
        capacity: '0x01',
        lock: {
          codeHash: '0x3714af858b8b82b2bb8f13d51f3cffede2dd8d352a6938334bb79e6b845e3658',
          hashType: 'type',
          args: '0x01',
        },
        type: {
          codeHash: '0x5e7a36a77e68eecc013dfa2fe6a23f3b6c344b04005808694ae6dd45eea4cfd5',
          hashType: 'type',
          args: '0x01',
        },
      }

      const input: Input = {
        previousOutput: {
          txHash: '0x01',
          index: '0x00',
        },
        since: '',
      }

      const mockBlock = {
        header: {
          timestamp: '0x',
          number: '0x02',
          epoch: '0x',
          compactTarget: '0x',
          dao: '0x',
          hash: '0x',
          nonce: '0x',
          parentHash: '0x',
          proposalsHash: '0x',
          transactionsRoot: '0x',
          extraHash: '0x',
          version: '0x',
        },
        transactions: [
          {
            cellDeps: [],
            hash: '0x02',
            headerDeps: [],
            inputs: [input],
            outputs: [output],
            outputsData: ['0x01'],
            version: '0x01',
            witnesses: ['0x01'],
          },
        ],
        uncles: [],
        proposals: [],
      }

      manager.onListenBlock(mockBlock)
      expect(mockXAdd).toBeCalledTimes(2)
      expect(manager.lastBlock?.header.number).toEqual('0x02')
      expect(
        manager.registryOutpoint.get(
          outpointToOutPointString({
            txHash: '0x01',
            index: '0x00',
          }),
        ),
      ).toBeUndefined()
      expect(
        manager.registryOutpoint.get(
          outpointToOutPointString({
            txHash: '0x02',
            index: '0x00',
          }),
        ),
      ).toEqual({ uri: ref.uri })
    })
  })
})
