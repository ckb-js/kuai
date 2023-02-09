import { ChainSource } from '@ckb-js/kuai-io/lib/types'
import { Script, RPC, BI } from '@ckb-lumos/lumos'
import { CKBComponents } from '@ckb-lumos/rpc/lib/types/api'

export class NervosChainSource implements ChainSource {
  #rpc: RPC

  constructor(rpcUrl: string) {
    this.#rpc = new RPC(rpcUrl)
  }

  getTipHeader = () => this.#rpc.getTipHeader()

  getCurrentEpoch = () => this.#rpc.getCurrentEpoch()

  getBlock = (blockNumber: string) => this.#rpc.getBlock(blockNumber)

  getTipBlockNumber = async () => {
    const header = await this.#rpc.getTipHeader()
    return header.number
  }

  getAllLiveCellsWithWitness = async (
    lockScript: Script,
    typeScript?: Script | undefined,
    startBlock?: BI,
    endBlock?: BI,
  ) => {
    const res: (CKBComponents.IndexerCell & { witness: string })[] = []

    const step = BI.from(1000)
    startBlock = startBlock ?? BI.from(0)
    endBlock = startBlock ?? BI.from(await this.getTipBlockNumber())

    let lastCursor = ''
    do {
      const cells = await this.#rpc.getCells(
        {
          script: lockScript,
          scriptType: 'lock',
          filter: {
            script: typeScript,
            blockRange: [startBlock.toHexString(), endBlock.toHexString()],
          },
        },
        'asc',
        step.toHexString(),
        lastCursor == '' ? undefined : lastCursor,
      )
      for (const cell of cells.objects) {
        const tx = await this.#rpc.getTransaction(cell.outPoint.txHash)
        res.push({ ...cell, witness: tx.transaction.witnesses[Number(cell.txIndex)] })
      }
      lastCursor = cells.lastCursor
    } while (lastCursor !== '0x')

    return Promise.resolve(res)
  }
}
