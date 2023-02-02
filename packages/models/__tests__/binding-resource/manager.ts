import { afterEach, describe, expect, it, jest } from '@jest/globals'
import { ProviderKey, Behavior, outPointToOutPointString } from '../../src'
import { Manager, ResourceBindingRegistry, CellChangeData } from '../../src'
import { utils, Input, Output, Block, Epoch, Header, Transaction, Cell } from '@ckb-lumos/base'
import { ChainSource } from '@ckb-js/kuai-io/lib/types'
import { TipHeaderListener } from '@ckb-js/kuai-io'
import type { Subscription } from 'rxjs'
import { CellChangeBuffer } from '../../src/resource-binding/cell-change-buffer'

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
      expect(manager.registry.get('0x11')?.get('0x22')).toEqual({
        uri: ref.uri,
        pattern: 'normal',
        status: 'registered',
      })
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

  describe('test update store in buffer when the store initiated', () => {
    const mockBlock: Block = {
      header: {
        timestamp: '0x',
        number: '0x896211',
        epoch: '0x',
        compactTarget: '0x',
        dao: '0x',
        hash: '0x4009f0b85dcba1bf23fe8dcb4a9de9e8d77f816ae8afceac1e56432b50239fb2',
        nonce: '0x71da0b841524ee070000000296000800',
        parentHash: '0x',
        proposalsHash: '0x',
        transactionsRoot: '0x',
        extraHash: '0x',
        version: '0x',
      },
      transactions: [],
      uncles: [],
      proposals: [],
    }
    const mockSource: ChainSource = {
      getTipBlockNumber: function (): Promise<string> {
        throw new Error('Function not implemented.')
      },
      getTipHeader: function (): Promise<Header> {
        return Promise.resolve(mockBlock.header)
      },
      getCurrentEpoch: function (): Promise<Epoch> {
        throw new Error('Function not implemented.')
      },
      getBlock: function (): Promise<Block> {
        return Promise.resolve(mockBlock)
      },
    }

    const manager = new Manager(new TipHeaderListener(mockSource), mockSource)
    let listener: { subscription: Subscription; updator: NodeJS.Timer }

    afterEach(() => {
      mockXAdd.mockClear()
      listener.subscription.unsubscribe()
      clearInterval(listener.updator)
    })

    it('cell update success', async () => {
      const registry = {
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
      jest.spyOn(CellChangeBuffer.prototype, 'popAll').mockImplementationOnce(() => [[change]])
      jest.spyOn(CellChangeBuffer.prototype, 'hasReadyStore').mockImplementationOnce(() => true)

      manager.register(
        utils.computeScriptHash(cell.cellOutput.lock),
        cell.cellOutput.type ? utils.computeScriptHash(cell.cellOutput.type) : 'null',
        registry.uri,
        'normal',
      )
      listener = manager.listen()
      await new Promise((resolve) => setTimeout(resolve, 2000))
      expect(mockXAdd).toBeCalledTimes(2)
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
    let listener: { subscription: Subscription; updator: NodeJS.Timer }

    afterEach(() => {
      mockXAdd.mockClear()
      listener.subscription.unsubscribe()
      clearInterval(listener.updator)
    })

    // This test is to test whether batch cell-update is ok.
    // Tx 0x01:
    //   Cell_A -> Cell_F
    //   Cell_B ->
    //   Cell_C -> Cell_G
    //   Cell_D -> Cell_H
    //   Cell_E -> Cell_I
    // Tx 0x02:
    //   Cell_F -> Cell_J
    //   Cell_G -> Cell_K
    //   Cell_H -> Cell_L
    //   Cell_P ->
    // Tx 0x03:
    //   Cell_I -> Cell_M
    //   Cell_J ->
    //   Cell_K -> Cell_N
    //   Cell_L -> Cell_O
    //
    // Registered:
    //   Store 1
    //     Cell_A
    //     Cell_E
    //   Store 2
    //     Cell_C
    //     Cell_D

    it('cell update success', async () => {
      const outputA: Output = {
        capacity: '0x1000',
        lock: {
          codeHash: '0xede199745fbd9e9f339f1dd2e92a586020d111432bfb81a6c2b12ddc9856f0ba',
          hashType: 'type',
          args: '0x974bab5b82e0c93c08c751158c209b124d4e1b247c0593be10',
        },
        type: {
          codeHash: '0xa9267ff5a16f38aa9382608eb9022883a78e6a40855107bb59f8406cce00e981',
          hashType: 'type',
          args: '0x2d8d67c8d73453c1a6d6d600e491b303910802e0cc90a709da9b15d26c5c48b3',
        },
      }

      const outputC: Output = {
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
      }

      const outputD: Output = {
        capacity: '0x1000',
        lock: {
          codeHash: '0xa4398768d87bd17aea1361edc3accd6a0117774dc4ebc813bfa173e8ac0d086d',
          hashType: 'type',
          args: '0x0075c62406c6b180d8ffe96400d7f08e6e89d186dc00',
        },
        type: {
          codeHash: '0xfef1d086d9f74d143c60bf03bd04bab29200dbf484c801c72774f2056d4c6718',
          hashType: 'type',
          args: '0xab21bfe2bf85927bb42faaf3006a355222e24d5ea1d4dec0e62f53a8e0c04690',
        },
      }

      const outputE: Output = {
        capacity: '0x1000',
        lock: {
          codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hashType: 'type',
          args: '0x2228dae340f587647362d31e3f04d7a51f8168dc',
        },
      }

      const inputA: Input = {
        previousOutput: {
          txHash: '0x637c22b7a3870de160455e34bbf6aa9957d8eefb897548951303044175e0ee8f',
          index: '0x1',
        },
        since: '',
      }

      const inputC: Input = {
        previousOutput: {
          txHash: '0xd185755336e948a17dc27b6d459c8bb96a6f6f684df375652a8dfc0dc2745f43',
          index: '0x1',
        },
        since: '',
      }

      const inputD: Input = {
        previousOutput: {
          txHash: '0x76822de290fb2f1ddef03b7b2468d49c39d815d3910af0900cb6274ced83e0ac',
          index: '0x1',
        },
        since: '',
      }

      const inputE: Input = {
        previousOutput: {
          txHash: '0xca925a41ac6233678c861de8f00beb137ae1b539cffde0d946ea8aecee5e6c3e',
          index: '0x1',
        },
        since: '',
      }

      const inputB: Input = {
        previousOutput: {
          txHash: '0x02280d71008fa910f87d6a99e7f74a79c406f1aac9f2ef3a3ce6711fee963929',
          index: '0x1',
        },
        since: '',
      }

      const outputF: Output = {
        capacity: '0x1000',
        lock: {
          codeHash: '0xede199745fbd9e9f339f1dd2e92a586020d111432bfb81a6c2b12ddc9856f0ba',
          hashType: 'type',
          args: '0x974bab5b82e0c93c08c751158c209b124d4e1b247c0593be10',
        },
        type: {
          codeHash: '0xa9267ff5a16f38aa9382608eb9022883a78e6a40855107bb59f8406cce00e981',
          hashType: 'type',
          args: '0x2d8d67c8d73453c1a6d6d600e491b303910802e0cc90a709da9b15d26c5c48b3',
        },
      }

      const outputG: Output = {
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
      }

      const outputH: Output = {
        capacity: '0x1000',
        lock: {
          codeHash: '0xa4398768d87bd17aea1361edc3accd6a0117774dc4ebc813bfa173e8ac0d086d',
          hashType: 'type',
          args: '0x0075c62406c6b180d8ffe96400d7f08e6e89d186dc00',
        },
        type: {
          codeHash: '0xfef1d086d9f74d143c60bf03bd04bab29200dbf484c801c72774f2056d4c6718',
          hashType: 'type',
          args: '0xab21bfe2bf85927bb42faaf3006a355222e24d5ea1d4dec0e62f53a8e0c04690',
        },
      }

      const outputI: Output = {
        capacity: '0x1000',
        lock: {
          codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hashType: 'type',
          args: '0x2228dae340f587647362d31e3f04d7a51f8168dc',
        },
      }

      const tx1: Transaction = {
        hash: '0xc435e8a16cbb8b1e016e958f1dc056b0bc341550d30bda5f578edb29fa366b9e',
        cellDeps: [],
        headerDeps: [],
        inputs: [inputA, inputC, inputD, inputE, inputB],
        outputs: [outputF, outputG, outputH, outputI],
        outputsData: [],
        version: '',
        witnesses: ['0x', '0x', '0x', '0x'],
      }

      const inputF: Input = {
        previousOutput: {
          txHash: tx1.hash ?? '',
          index: '0x0',
        },
        since: '',
      }

      const inputG: Input = {
        previousOutput: {
          txHash: tx1.hash ?? '',
          index: '0x1',
        },
        since: '',
      }

      const inputH: Input = {
        previousOutput: {
          txHash: tx1.hash ?? '',
          index: '0x2',
        },
        since: '',
      }

      const inputI: Input = {
        previousOutput: {
          txHash: tx1.hash ?? '',
          index: '0x3',
        },
        since: '',
      }

      const inputP: Input = {
        previousOutput: {
          txHash: '0x8dc6f7105ee7299ace0744bc5f508935e7bb9346886aff4c942f20d423d6b660',
          index: '0x1',
        },
        since: '',
      }

      const outputJ: Output = {
        capacity: '0x1000',
        lock: {
          codeHash: '0xede199745fbd9e9f339f1dd2e92a586020d111432bfb81a6c2b12ddc9856f0ba',
          hashType: 'type',
          args: '0x974bab5b82e0c93c08c751158c209b124d4e1b247c0593be10',
        },
        type: {
          codeHash: '0xa9267ff5a16f38aa9382608eb9022883a78e6a40855107bb59f8406cce00e981',
          hashType: 'type',
          args: '0x2d8d67c8d73453c1a6d6d600e491b303910802e0cc90a709da9b15d26c5c48b3',
        },
      }

      const outputK: Output = {
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
      }

      const outputL: Output = {
        capacity: '0x1000',
        lock: {
          codeHash: '0xa4398768d87bd17aea1361edc3accd6a0117774dc4ebc813bfa173e8ac0d086d',
          hashType: 'type',
          args: '0x0075c62406c6b180d8ffe96400d7f08e6e89d186dc00',
        },
        type: {
          codeHash: '0xfef1d086d9f74d143c60bf03bd04bab29200dbf484c801c72774f2056d4c6718',
          hashType: 'type',
          args: '0xab21bfe2bf85927bb42faaf3006a355222e24d5ea1d4dec0e62f53a8e0c04690',
        },
      }

      const tx2: Transaction = {
        hash: '0x2b8f77e7812a38d06d659fa4e047a9863583afc691ce1466549d9aae8d63d562',
        cellDeps: [],
        headerDeps: [],
        inputs: [inputF, inputG, inputH, inputP],
        outputs: [outputJ, outputK, outputL],
        outputsData: [],
        version: '',
        witnesses: ['0x', '0x', '0x'],
      }

      const inputJ: Input = {
        previousOutput: {
          txHash: tx2.hash ?? '',
          index: '0x0',
        },
        since: '',
      }

      const inputK: Input = {
        previousOutput: {
          txHash: tx2.hash ?? '',
          index: '0x1',
        },
        since: '',
      }

      const inputL: Input = {
        previousOutput: {
          txHash: tx2.hash ?? '',
          index: '0x2',
        },
        since: '',
      }

      const outputN: Output = {
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
      }

      const outputO: Output = {
        capacity: '0x1000',
        lock: {
          codeHash: '0xa4398768d87bd17aea1361edc3accd6a0117774dc4ebc813bfa173e8ac0d086d',
          hashType: 'type',
          args: '0x0075c62406c6b180d8ffe96400d7f08e6e89d186dc00',
        },
        type: {
          codeHash: '0xfef1d086d9f74d143c60bf03bd04bab29200dbf484c801c72774f2056d4c6718',
          hashType: 'type',
          args: '0xab21bfe2bf85927bb42faaf3006a355222e24d5ea1d4dec0e62f53a8e0c04690',
        },
      }

      const outputM: Output = {
        capacity: '0x1000',
        lock: {
          codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          hashType: 'type',
          args: '0x2228dae340f587647362d31e3f04d7a51f8168dc',
        },
      }

      const witnesses = ['0x01', '0x02', '0x03']
      const outputsData = ['0x04', '0x05', '0x06']
      const tx3: Transaction = {
        hash: '0xfeb8784185ed6880e318610333989db5a4bb9fdaca054564859bd2b66e18eac3',
        cellDeps: [],
        headerDeps: [],
        inputs: [inputJ, inputK, inputL, inputI],
        outputs: [outputN, outputO, outputM],
        outputsData,
        version: '',
        witnesses,
      }

      const mockBlock: Block = {
        header: {
          timestamp: '0x',
          number: '0x896211',
          epoch: '0x',
          compactTarget: '0x',
          dao: '0x',
          hash: '0x4009f0b85dcba1bf23fe8dcb4a9de9e8d77f816ae8afceac1e56432b50239fb2',
          nonce: '0x71da0b841524ee070000000296000800',
          parentHash: '0x',
          proposalsHash: '0x',
          transactionsRoot: '0x',
          extraHash: '0x',
          version: '0x',
        },
        transactions: [tx1, tx2, tx3],
        uncles: [],
        proposals: [],
      }

      const ref1 = {
        name: 'store1',
        protocol: 'local',
        path: '/',
        uri: 'local://store1',
      }

      const ref2 = {
        name: 'store2',
        protocol: 'local',
        path: '/',
        uri: 'local://store2',
      }

      mockSource.getTipHeader = () => Promise.resolve(mockBlock.header)
      listener = manager.listen()
      mockSource.getBlock = () => Promise.resolve(mockBlock)
      manager.register(
        utils.computeScriptHash(outputA.lock),
        outputA.type ? utils.computeScriptHash(outputA.type) : 'null',
        ref1.uri,
        'normal',
      )
      manager.register(
        utils.computeScriptHash(outputE.lock),
        outputE.type ? utils.computeScriptHash(outputE.type) : 'null',
        ref1.uri,
        'normal',
      )
      manager.register(
        utils.computeScriptHash(outputD.lock),
        outputD.type ? utils.computeScriptHash(outputD.type) : 'null',
        ref2.uri,
        'normal',
      )
      manager.register(
        utils.computeScriptHash(outputC.lock),
        outputC.type ? utils.computeScriptHash(outputC.type) : 'null',
        ref2.uri,
        'normal',
      )

      await new Promise((resolve) => setTimeout(resolve, 2000))
      expect(mockXAdd).toBeCalledTimes(2)
      expect(mockXAdd.mock.calls[0][0]).toEqual(ref2.uri)
      expect(mockXAdd.mock.calls[0][3]).toEqual('local://resource')
      expect(mockXAdd.mock.calls[1][0]).toEqual(ref1.uri)
      expect(mockXAdd.mock.calls[1][3]).toEqual('local://resource')
      expect(JSON.parse(mockXAdd.mock.calls[0][7] as string).value).toEqual({
        type: 'update_cells',
        value: [
          {
            witness: witnesses[0],
            cell: {
              cellOutput: outputN,
              data: outputsData[0],
              outPoint: {
                txHash: tx3.hash,
                index: '0x0',
              },
              blockHash: mockBlock.header.hash,
              blockNumber: mockBlock.header.number,
            },
          },
          {
            witness: witnesses[1],
            cell: {
              cellOutput: outputO,
              data: outputsData[1],
              outPoint: {
                txHash: tx3.hash,
                index: '0x1',
              },
              blockHash: mockBlock.header.hash,
              blockNumber: mockBlock.header.number,
            },
          },
        ],
      })
      expect(JSON.parse(mockXAdd.mock.calls[1][7] as string).value).toEqual({
        type: 'update_cells',
        value: [
          {
            witness: witnesses[2],
            cell: {
              cellOutput: outputM,
              data: outputsData[2],
              outPoint: {
                txHash: tx3.hash,
                index: '0x2',
              },
              blockHash: mockBlock.header.hash,
              blockNumber: mockBlock.header.number,
            },
          },
        ],
      })
      expect(manager.lastBlock?.header.number).toEqual(mockBlock.header.number)
    })

    it('cell remove success', async () => {
      const inputN: Input = {
        previousOutput: {
          txHash: '0xfeb8784185ed6880e318610333989db5a4bb9fdaca054564859bd2b66e18eac3',
          index: '0x0',
        },
        since: '',
      }

      const inputM: Input = {
        previousOutput: {
          txHash: '0xfeb8784185ed6880e318610333989db5a4bb9fdaca054564859bd2b66e18eac3',
          index: '0x2',
        },
        since: '',
      }

      const inputO: Input = {
        previousOutput: {
          txHash: '0xfeb8784185ed6880e318610333989db5a4bb9fdaca054564859bd2b66e18eac3',
          index: '0x1',
        },
        since: '',
      }

      const mockBlock = {
        header: {
          timestamp: '0x',
          number: '0x896212',
          epoch: '0x',
          compactTarget: '0x',
          dao: '0x',
          hash: '0x3bc111c63c591a5850c91b64673caeb8390333e8d2fed01498d118aaa6aaa1f6',
          nonce: '0xc18fe08b8a0d000000000007c996dcf0',
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
            inputs: [inputN, inputM, inputO],
            outputs: [],
            outputsData: ['0x01'],
            version: '0x01',
            witnesses: ['0x01'],
          },
        ],
        uncles: [],
        proposals: [],
      }

      mockSource.getTipHeader = () => Promise.resolve(mockBlock.header)
      listener = manager.listen()
      mockSource.getBlock = () => Promise.resolve(mockBlock)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      expect(mockXAdd).toBeCalledTimes(2)
      expect(JSON.parse(mockXAdd.mock.calls[0][7] as string).value).toEqual({
        type: 'remove_cell',
        value: [outPointToOutPointString(inputN.previousOutput), outPointToOutPointString(inputO.previousOutput)],
      })
      expect(JSON.parse(mockXAdd.mock.calls[1][7] as string).value).toEqual({
        type: 'remove_cell',
        value: [outPointToOutPointString(inputM.previousOutput)],
      })
      expect(manager.lastBlock?.header.number).toEqual(mockBlock.header.number)
      expect(manager.registryOutPoint.get(outPointToOutPointString(inputN.previousOutput))).toBeUndefined()
      expect(manager.registryOutPoint.get(outPointToOutPointString(inputM.previousOutput))).toBeUndefined()
    })
  })
})
