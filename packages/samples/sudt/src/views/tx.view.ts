import { type Cell, helpers, commons } from '@ckb-lumos/lumos'
import { getConfig } from '@ckb-lumos/config-manager'
import { addBuiltInCellDeps } from '@ckb-js/kuai-common'
import { SudtResponse } from '../response'

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
      switch (input.cellOutput.lock.codeHash) {
        case getConfig().SCRIPTS.ANYONE_CAN_PAY?.CODE_HASH:
          txSkeleton = await commons.anyoneCanPay.setupInputCell(txSkeleton, input)
          break
        case getConfig().SCRIPTS.OMNILOCK?.CODE_HASH:
          txSkeleton = await commons.omnilock.setupInputCell(txSkeleton, input)
          break
        default:
          throw SudtResponse.err('400', 'not support lock script')
      }
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
