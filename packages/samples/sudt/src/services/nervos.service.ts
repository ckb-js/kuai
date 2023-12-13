import { BI, Indexer, Output, RPC, Script, Transaction, utils } from '@ckb-lumos/lumos'

export class NervosService {
  #indexer: Indexer
  #rpc: RPC
  constructor(rpcUrl: string, indexerUrl: string) {
    this.#indexer = new Indexer(rpcUrl, indexerUrl)
    this.#rpc = new RPC(rpcUrl)
  }

  #collectTokenAmount = (
    map: Map<string, BI>,
    typeId: string,
    output: Output,
    outputData: string,
    lockMap: Map<string, Script>,
  ): Map<string, BI> => {
    if (output.type) {
      if (utils.computeScriptHash(output.type) !== typeId) return map

      const lockHash = utils.computeScriptHash(output.lock)
      lockMap.set(lockHash, output.lock)

      const totalAmount = map.get(typeId) ?? BI.from(0)
      map.set(lockHash, totalAmount.add(BI.from(outputData)))
    }

    return map
  }

  #filterFrom = async (tx: Transaction, typeIds: string, lockMap: Map<string, Script>): Promise<Map<string, BI>> => {
    let from = new Map<string, BI>()
    for (const input of tx.inputs) {
      const previousTransaction = await this.#rpc.getTransaction(input.previousOutput.txHash)
      const txIndex = parseInt(input.previousOutput.index, 16)
      const previousOutput = previousTransaction.transaction.outputs[txIndex]
      console.log(previousOutput)
      const previousOutputData = previousTransaction.transaction.outputsData[txIndex]
      from = this.#collectTokenAmount(from, typeIds, previousOutput, previousOutputData, lockMap)
    }

    return from
  }

  #filterTo = async (tx: Transaction, typeId: string, lockMap: Map<string, Script>): Promise<Map<string, BI>> =>
    tx.outputs.reduce((acc, cur, key) => {
      this.#collectTokenAmount(acc, typeId, cur, tx.outputsData[key], lockMap)
      return acc
    }, new Map<string, BI>())

  fetchTransferHistory = async (lockScript: Script, typeScript: Script, sizeLimit: number, lastCursor?: string) => {
    const txs = await this.#indexer.getTransactions(
      {
        script: lockScript,
        scriptType: 'lock',
        filter: { script: typeScript },
      },
      { order: 'desc', sizeLimit, lastCursor },
    )
    const lockMap = new Map<string, Script>()

    const history = await Promise.all(
      txs.objects.map(async ({ txHash }) => {
        const { transaction } = await this.#rpc.getTransaction(txHash)
        const from = await this.#filterFrom(transaction, utils.computeScriptHash(typeScript), lockMap)
        const to = await this.#filterTo(transaction, utils.computeScriptHash(typeScript), lockMap)

        return {
          froms: Array.from(from.entries()).map(([lockHash, amount]) => ({
            lock: lockMap.get(lockHash),
            amount: amount.toString(),
          })),
          to: Array.from(to.entries()).map(([lockHash, amount]) => ({
            lock: lockMap.get(lockHash),
            amount: amount.toString(),
          })),
        }
      }),
    )

    return {
      lastCursor: txs.lastCursor,
      history,
    }
  }
}
