import { CellChangeData } from '@ckb-js/kuai-models'
import { Cell, helpers, commons } from '@ckb-lumos/lumos'

export class Tx {
  static async toJson(
    txSkeleton: helpers.TransactionSkeletonType,
    inputCells: Cell[],
    outputData: CellChangeData[],
  ): Promise<string> {
    txSkeleton.update('inputs', (inputs) => {
      return inputs.push(...inputCells)
    })

    for (const [output, witness] of outputData) {
      txSkeleton.update('outputs', (outputs) => outputs.push(output))

      txSkeleton.update('witnesses', (witnesses) => witnesses.push(witness))
    }

    txSkeleton = commons.common.prepareSigningEntries(txSkeleton)

    return JSON.stringify({
      tx: helpers.createTransactionFromSkeleton(txSkeleton),
    })
  }
}
