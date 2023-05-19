import { TransactionWithStatus } from '@ckb-lumos/base'
import { RPC } from '@ckb-lumos/lumos'
import { scheduler } from 'node:timers/promises'

export const waitUntilCommitted = async (rpc: RPC, txHash: string, timeout = 120): Promise<TransactionWithStatus> => {
  let waitTime = 0
  for (;;) {
    const txStatus = await rpc.getTransaction(txHash)
    if (txStatus !== null) {
      if (txStatus.txStatus.status === 'committed') {
        return txStatus
      }
    } else {
      throw new Error(`wait for ${txHash} until committed failed with null txStatus`)
    }
    waitTime += 1
    if (waitTime > timeout) {
      console.warn('waitUntilCommitted timeout', { txHash, timeout, txStatus })
      throw new Error(`wait for ${txHash} until committed timeout after ${timeout} seconds`)
    }
    await scheduler.wait(1000)
  }
}
