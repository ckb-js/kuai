import { BI, Indexer, Output, RPC, Script, Transaction, utils } from '@ckb-lumos/lumos'

type TypeHash = string
type LockHash = string

export class NervosService {
  #indexer: Indexer
  #rpc: RPC
  constructor(rpcUrl: string, indexerUrl: string) {
    this.#indexer = new Indexer(rpcUrl, indexerUrl)
    this.#rpc = new RPC(rpcUrl)
  }

  #collectTokenAmount = (
    map: Map<LockHash, BI>,
    typeId: string,
    output: Output,
    outputData: string,
    lockMap: Map<string, Script>,
  ): Map<string, BI> => {
    if (output.type) {
      if (utils.computeScriptHash(output.type) !== typeId) return map

      const lockHash = utils.computeScriptHash(output.lock)
      lockMap.set(lockHash, output.type)

      const totalAmount = map.get(typeId) ?? BI.from(0)
      map.set(lockHash, totalAmount.add(BI.from(outputData)))
    }

    return map
  }

  #filterFrom = async (
    tx: Transaction,
    typeIds: string[],
    lockMap: Map<string, Script>,
  ): Promise<Map<TypeHash, Map<LockHash, BI>>> => {
    const from = new Map<TypeHash, Map<LockHash, BI>>()
    for (const typeId of typeIds) {
      let fromSingleTx = new Map<string, BI>()
      for (const input of tx.inputs) {
        const previousTransaction = await this.#rpc.getTransaction(input.previousOutput.txHash)
        const txIndex = parseInt(input.previousOutput.index, 16)
        const previousOutput = previousTransaction.transaction.outputs[txIndex]
        const previousOutputData = previousTransaction.transaction.outputsData[txIndex]
        fromSingleTx = this.#collectTokenAmount(fromSingleTx, typeId, previousOutput, previousOutputData, lockMap)
      }

      if (Array.from(fromSingleTx.entries()).length > 0) {
        from.set(typeId, fromSingleTx)
      }
    }
    return from
  }

  #filterTo = async (
    tx: Transaction,
    typeIds: string[],
    lockMap: Map<string, Script>,
  ): Promise<Map<TypeHash, Map<LockHash, BI>>> =>
    typeIds.reduce((acc, typeId) => {
      const toSingleTx = tx.outputs.reduce((acc, cur, key) => {
        this.#collectTokenAmount(acc, typeId, cur, tx.outputsData[key], lockMap)
        return acc
      }, new Map<string, BI>())

      if (Array.from(toSingleTx.entries()).length > 0) {
        acc.set(typeId, toSingleTx)
      }

      return acc
    }, new Map<TypeHash, Map<LockHash, BI>>())

  fetchTransferHistory = async (lockScript: Script, typeIds: string[], sizeLimit: number, lastCursor?: string) => {
    const txs = await this.#indexer.getTransactions(
      {
        script: lockScript,
        scriptType: 'lock',
      },
      { order: 'desc', sizeLimit, lastCursor },
    )
    const lockMap = new Map<string, Script>()

    const history = await Promise.all(
      txs.objects.map(async ({ txHash }) => {
        const { transaction } = await this.#rpc.getTransaction(txHash)
        const from = await this.#filterFrom(transaction, typeIds, lockMap)
        const to = await this.#filterTo(transaction, typeIds, lockMap)

        return {
          txHash,
          list: typeIds
            .filter((typeId) => {
              return from.has(typeId) || to.has(typeId)
            })
            .map((typeId) => ({
              typeId,
              from: from.get(typeId)
                ? Array.from(from.get(typeId)!.entries()).map(([lockHash, amount]) => ({
                    lock: lockMap.get(lockHash)!,
                    amount: amount.toString(),
                  }))
                : [],
              to: to.get(typeId)
                ? Array.from(to.get(typeId)!.entries()).map(([lockHash, amount]) => ({
                    lock: lockMap.get(lockHash)!,
                    amount: amount.toString(),
                  }))
                : [],
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
