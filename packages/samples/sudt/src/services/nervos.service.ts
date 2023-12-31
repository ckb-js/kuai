import { BI, Indexer, RPC, Script, Transaction, utils } from '@ckb-lumos/lumos'
import { encodeToAddress } from '@ckb-lumos/helpers'
import { number } from '@ckb-lumos/codec'

export interface Transfer {
  address: string
  typeId?: string
  ckb: string
  amount?: string
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
        const typeId = utils.computeScriptHash(previousOutput.type)
        if (typeIds.find((i) => typeId === i)) {
          const previousOutputData = previousTransaction.transaction.outputsData[txIndex]
          from.push({
            address: encodeToAddress(previousOutput.lock),
            typeId,
            ckb: previousOutput.capacity,
            amount: BI.from(number.Uint128LE.unpack(previousOutputData.slice(0, 34))).toString(),
          })
        }
      } else {
        from.push({
          address: encodeToAddress(previousOutput.lock),
          ckb: previousOutput.capacity,
        })
      }
    }

    return from
  }

  #filterTo = async (tx: Transaction, typeIds: string[]): Promise<Transfer[]> =>
    tx.outputs.reduce<Transfer[]>((acc, cur, key) => {
      if (cur.type) {
        const typeId = utils.computeScriptHash(cur.type)
        if (typeIds.find((i) => typeId === i)) {
          acc.push({
            address: encodeToAddress(cur.lock),
            typeId,
            ckb: cur.capacity,
            amount: BI.from(number.Uint128LE.unpack(tx.outputsData[key].slice(0, 34))).toString(),
          })
        }
      } else {
        acc.push({
          address: encodeToAddress(cur.lock),
          ckb: cur.capacity,
        })
      }
      return acc
    }, [])

  fetchTransferHistory = async ({
    lockScript,
    typeIds,
    sizeLimit,
    lastCursor,
  }: {
    lockScript: Script
    typeIds: string[]
    sizeLimit: number
    lastCursor?: string
  }) => {
    const txs = await this.#indexer.getTransactions(
      {
        script: lockScript,
        scriptType: 'lock',
        groupByTransaction: true,
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
