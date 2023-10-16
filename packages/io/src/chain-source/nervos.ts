import type { ChainSource } from '../types'
import { Script, RPC, BI } from '@ckb-lumos/lumos'
import type { CKBComponents } from '@ckb-lumos/rpc/lib/types/api'

export class NervosChainSource implements ChainSource {
  #rpc: RPC

  constructor(
    rpcUrl: string,
    private _getCellsLimit: number = 1000,
  ) {
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
    scripts: Partial<Record<'lock' | 'type', Script>>,
    startBlock?: BI,
    endBlock?: BI,
  ) => {
    const res: (CKBComponents.IndexerCell & { witness: string })[] = []

    startBlock = startBlock ?? BI.from(0)
    endBlock = endBlock ?? BI.from(await this.getTipBlockNumber())

    let lastCursor = ''
    let scriptFilterOption: CKBComponents.GetCellsSearchKey<true> | undefined = undefined
    if (scripts.lock && scripts.type) {
      scriptFilterOption = {
        script: scripts.lock,
        scriptType: 'lock',
        filter: {
          script: scripts.type,
        },
        withData: true,
      }
    } else if (scripts.lock) {
      scriptFilterOption = {
        script: scripts.lock,
        scriptType: 'lock',
        withData: true,
      }
    } else if (scripts.type) {
      scriptFilterOption = {
        script: scripts.type,
        scriptType: 'type',
        withData: true,
      }
    }
    if (!scriptFilterOption) throw new Error('One of lock script or type script is required at least')
    do {
      const cells = await this.#rpc.getCells(
        {
          ...scriptFilterOption,
          filter: {
            ...scriptFilterOption?.filter,
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
