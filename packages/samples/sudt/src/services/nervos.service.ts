import { BI, Indexer, RPC, Script, Transaction, utils } from '@ckb-lumos/lumos'
import { encodeToAddress } from '@ckb-lumos/helpers'

export interface Transfer {
  address: string
  token: string
  ckb: string
  amount: string
}

export class NervosService {
  #indexer: Indexer
  #rpc: RPC
  constructor(rpcUrl: string, indexerUrl: string) {
    this.#indexer = new Indexer(rpcUrl, indexerUrl)
    this.#rpc = new RPC(rpcUrl)
  }

  #filterFrom = async (tx: Transaction, typeIds: string[]): Promise<Transfer[]> => {
    const from: Transfer[] = []
    for (const input of tx.inputs) {
      const previousTransaction = await this.#rpc.getTransaction(input.previousOutput.txHash)
      const txIndex = parseInt(input.previousOutput.index, 16)
      const previousOutput = previousTransaction.transaction.outputs[txIndex]
      if (previousOutput.type) {
        const typeHash = utils.computeScriptHash(previousOutput.type)
        if (typeIds.find((typeId) => typeHash === typeId)) {
          const previousOutputData = previousTransaction.transaction.outputsData[txIndex]
          from.push({
            address: encodeToAddress(previousOutput.lock),
            token: typeHash,
            ckb: previousOutput.capacity,
            amount: BI.from(previousOutputData).toString(),
          })
        }
      } else {
        from.push({
          address: encodeToAddress(previousOutput.lock),
          token: '',
          ckb: previousOutput.capacity,
          amount: '0',
        })
      }
    }

    return from
  }

  #filterTo = async (tx: Transaction, typeIds: string[]): Promise<Transfer[]> =>
    tx.outputs.reduce<Transfer[]>((acc, cur, key) => {
      if (cur.type) {
        const typeHash = utils.computeScriptHash(cur.type)
        if (typeIds.find((typeId) => typeHash === typeId)) {
          acc.push({
            address: encodeToAddress(cur.lock),
            token: typeHash,
            ckb: cur.capacity,
            amount: tx.outputsData[key],
          })
        }
      } else {
        acc.push({
          address: encodeToAddress(cur.lock),
          token: 'CKB',
          ckb: cur.capacity,
          amount: '0',
        })
      }
      return acc
    }, [])

  fetchTransferHistory = async (lockScript: Script, typeIds: string[], sizeLimit: number, lastCursor?: string) => {
    const txs = await this.#indexer.getTransactions(
      {
        script: lockScript,
        scriptType: 'lock',
      },
      { order: 'desc', sizeLimit, lastCursor },
    )
    const history = await Promise.all(
      txs.objects.map(async ({ txHash }) => {
        const { transaction } = await this.#rpc.getTransaction(txHash)
        const from = await this.#filterFrom(transaction, typeIds)
        const to = await this.#filterTo(transaction, typeIds)

        return {
          txHash,
          from,
          to,
        }
      }),
    )

    return {
      lastCursor: txs.lastCursor,
      history,
    }
  }
}
