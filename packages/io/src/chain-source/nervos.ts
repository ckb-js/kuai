import type { ChainSource } from '../types'
import { Script, RPC, BI } from '@ckb-lumos/lumos'
import type { CKBComponents } from '@ckb-lumos/rpc/lib/types/api'

export class NervosChainSource implements ChainSource {
  #rpc: RPC

  constructor(rpcUrl: string, private _getCellsLimit: number = 1000) {
    this.#rpc = new RPC(rpcUrl)
  }

  getTipHeader = () => this.#rpc.getTipHeader()

  getCurrentEpoch = () => this.#rpc.getCurrentEpoch()

  getBlock = (blockNumber: string) => this.#rpc.getBlockByNumber(blockNumber)

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

    startBlock = startBlock ?? BI.from(0)
    endBlock = endBlock ?? BI.from(await this.getTipBlockNumber())

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
        `0x${this._getCellsLimit.toString(16)}`,
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
