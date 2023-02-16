import { Cell, helpers, config } from '@ckb-lumos/lumos'
import { SECP_SIGNATURE_PLACEHOLDER, OMNILOCK_SIGNATURE_PLACEHOLDER } from '@ckb-lumos/common-scripts/lib/helper'
import { blockchain } from '@ckb-lumos/base'
import { bytes } from '@ckb-lumos/codec'

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
    txSkeleton = txSkeleton.update('outputs', (v) => v.push(...outputs))
    const CONFIG = config.getConfig()
    txSkeleton = txSkeleton.update('cellDeps', (cellDeps) =>
      cellDeps.push(
        {
          outPoint: {
            txHash: CONFIG.SCRIPTS.OMNILOCK!.TX_HASH,
            index: CONFIG.SCRIPTS.OMNILOCK!.INDEX,
          },
          depType: CONFIG.SCRIPTS.OMNILOCK!.DEP_TYPE,
        },
        {
          outPoint: {
            txHash: CONFIG.SCRIPTS.SECP256K1_BLAKE160!.TX_HASH,
            index: CONFIG.SCRIPTS.SECP256K1_BLAKE160!.INDEX,
          },
          depType: CONFIG.SCRIPTS.SECP256K1_BLAKE160!.DEP_TYPE,
        },
      ),
    )

    inputs.forEach((input, idx) => {
      txSkeleton = txSkeleton.update('inputs', (inputs) => inputs.push(input))

      txSkeleton = txSkeleton.update('witnesses', (wit) => {
        if (!witnesses?.[idx] || witnesses?.[idx] === '0x' || witnesses?.[idx] === '') {
          const omniLock = CONFIG.SCRIPTS.OMNILOCK as NonNullable<config.ScriptConfig>
          const fromLockScript = input.cellOutput.lock
          return wit.push(
            bytes.hexify(
              blockchain.WitnessArgs.pack({
                lock:
                  omniLock.CODE_HASH === fromLockScript.codeHash && fromLockScript.hashType === omniLock.HASH_TYPE
                    ? OMNILOCK_SIGNATURE_PLACEHOLDER
                    : SECP_SIGNATURE_PLACEHOLDER,
              }),
            ),
          )
        }
        return wit.push(witnesses?.[idx])
      })
    })

    return helpers.transactionSkeletonToObject(txSkeleton)
  }
}
