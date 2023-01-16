import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { ProviderKey, Behavior, outPointToOutPointString } from '../../src'
import { Manager } from '../../src'
import { utils, Input, Output, Block, Epoch, Header } from '@ckb-lumos/base'
import { ChainSource } from '@ckb-js/kuai-io/lib/types'
import { TipHeaderListener } from '@ckb-js/kuai-io'

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

const mockSource: ChainSource = {
  getTipBlockNumber: function (): Promise<string> {
    throw new Error('Function not implemented.')
  },
  getTipHeader: function (): Promise<Header> {
    throw new Error('Function not implemented.')
  },
  getCurrentEpoch: function (): Promise<Epoch> {
    throw new Error('Function not implemented.')
  },
  getBlock: function (): Promise<Block> {
    throw new Error('Function not implemented.')
  },
}

const mockListener = new TipHeaderListener(mockSource)

describe('Test resource binding', () => {
  describe('test handleCall with register', () => {
    it('register success', () => {
      const manager = new Manager(mockListener, mockSource)
      manager.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          pattern: 'normal',
          value: {
            type: 'register',
            register: {
              typeScriptHash: '0x11',
              lockScriptHash: '0x22',
              uri: ref.uri,
              pattern: 'normal',
            },
          },
        },
      })
      expect(manager.registry.get('0x11')?.get('0x22')).toEqual({ uri: ref.uri, pattern: 'normal' })
      expect(manager.registryReverse.get(ref.uri)).toEqual(['0x11', '0x22'])
    })
  })
  describe('test handleCall with revoke', () => {
    it('revoke success', () => {
      const manager = new Manager(mockListener, mockSource)
      manager.handleCall({
        from: ref,
        behavior: Behavior.Call,
        payload: {
          pattern: 'normal',
          value: {
            type: 'register',
            register: {
              typeScriptHash: '0x11',
              lockScriptHash: '0x22',
              uri: ref.uri,
              pattern: 'normal',
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

    it('will to nothing when no registry', () => {
      const manager = new Manager(mockListener, mockSource)
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
    })
  })
  describe('test new block header arrived', () => {
    const manager = new Manager(mockListener, mockSource)

    const mockHeader = {
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
    }

    it('update top block number success', () => {
      manager.onListenBlock(mockHeader)
      expect(manager.tipBlockNumber.toHexString()).toEqual('0x1')
      mockHeader.number = '0x02'
      manager.onListenBlock(mockHeader)
      expect(manager.tipBlockNumber.toHexString()).toEqual('0x2')
    })

    it("dont't update when block arrived is behind the top", () => {
      mockHeader.number = '0x01'
      manager.onListenBlock(mockHeader)
      expect(manager.tipBlockNumber.toHexString()).toEqual('0x2')
    })
  })

  describe('test update store when latest block arrived', () => {
    const mockSource: ChainSource = {
      getTipBlockNumber: function (): Promise<string> {
        throw new Error('Function not implemented.')
      },
      getTipHeader: function (): Promise<Header> {
        throw new Error('Function not implemented.')
      },
      getCurrentEpoch: function (): Promise<Epoch> {
        throw new Error('Function not implemented.')
      },
      getBlock: function (): Promise<Block> {
        throw new Error('Function not implemented.')
      },
    }
    const manager = new Manager(new TipHeaderListener(mockSource), mockSource)

    afterEach(() => {
      mockXAdd.mockClear()
    })

    it('cell update success', async () => {
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
      mockSource.getTipHeader = () => Promise.resolve(mockBlock.header)
      const { subscription, updator } = manager.listen()
      mockSource.getBlock = () => Promise.resolve(mockBlock)
      /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
      manager.register(utils.computeScriptHash(output.lock), utils.computeScriptHash(output.type!), ref.uri, 'normal')
      await new Promise((resolve) => setTimeout(resolve, 2000))
      expect(mockXAdd).toBeCalled()
      expect(manager.lastBlock?.header.number).toEqual('0x01')
      expect(
        manager.registryOutpoint.get(
          outPointToOutPointString({
            txHash: '0x01',
            index: '0x0',
          }),
        ),
      ).toEqual({ uri: ref.uri, pattern: 'normal' })
      subscription.unsubscribe()
      clearInterval(updator)
    })

    it('ignore the cell when not exists in registry', async () => {
      const output: Output = {
        capacity: '0x01',
        lock: {
          codeHash: '0x3214af858b8b82b2bb8f13d51f3cffede2dd8d352a6938334bb79e6b845e3658',
          hashType: 'type',
          args: '0x01',
        },
        type: {
          codeHash: '0x5e7a36677e68eecc013dfa2fe6a23f3b6c344b04005808694ae6dd45eea4cfd5',
          hashType: 'type',
          args: '0x01',
        },
      }
      const input: Input = {
        previousOutput: {
          txHash: '0x12',
          index: '0x2',
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
            hash: '0x01',
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

      mockSource.getTipHeader = () => Promise.resolve(mockBlock.header)
      const { subscription, updator } = manager.listen()
      mockSource.getBlock = () => Promise.resolve(mockBlock)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      expect(mockXAdd).not.toBeCalled()
      subscription.unsubscribe()
      clearInterval(updator)
    })

    it('cell remove success', async () => {
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
          number: '0x03',
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

      mockSource.getTipHeader = () => Promise.resolve(mockBlock.header)
      const { subscription, updator } = manager.listen()
      mockSource.getBlock = () => Promise.resolve(mockBlock)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      expect(mockXAdd).toBeCalledTimes(2)
      expect(manager.lastBlock?.header.number).toEqual('0x03')
      expect(
        manager.registryOutpoint.get(
          outPointToOutPointString({
            txHash: '0x01',
            index: '0x00',
          }),
        ),
      ).toBeUndefined()
      expect(
        manager.registryOutpoint.get(
          outPointToOutPointString({
            txHash: '0x02',
            index: '0x0',
          }),
        ),
      ).toEqual({ uri: ref.uri, pattern: 'normal' })
      subscription.unsubscribe()
      clearInterval(updator)
    })
  })
})
