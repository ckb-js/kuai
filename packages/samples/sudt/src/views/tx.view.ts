import { type Cell, helpers, commons } from '@ckb-lumos/lumos'
import { addBuiltInCellDeps } from '@ckb-js/kuai-common'

export class Tx {
  static async toJsonString({
    inputs,
    outputs,
    witnesses,
  }: {
    inputs: Cell[]
    outputs: Cell[]
    witnesses?: string[]
  }): Promise<helpers.TransactionSkeletonObject> {
    let txSkeleton = helpers.TransactionSkeleton({})
    for (const input of inputs) {
      txSkeleton = await commons.omnilock.setupInputCell(txSkeleton, input)
      txSkeleton = txSkeleton.remove('outputs')
    }
    txSkeleton = txSkeleton.update('outputs', (v) => v.push(...outputs))
    txSkeleton = addBuiltInCellDeps(txSkeleton, 'SUDT')

    if (witnesses) {
      witnesses.forEach((witness) => {
        txSkeleton = txSkeleton.update('witnesses', (v) => v.push(witness))
      })
    }

    return helpers.transactionSkeletonToObject(txSkeleton)
  }
}
