import type { TransactionWithStatus } from '@ckb-lumos/base'
import type { RPC } from '@ckb-lumos/lumos'
import { scheduler } from 'node:timers/promises'
import path from 'node:path'
import fs from 'fs'
import { request } from 'undici'
import { PATH } from './constant'

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

export const createPath = (path: string) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true })
  }
  return path
}

export const cachePath = (...paths: string[]) => createPath(path.resolve(PATH.cache, ...paths))

export const configPath = (...paths: string[]) => createPath(path.resolve(PATH.config, ...paths))

// TODO: use https://github.com/ckb-js/kuai/pull/301/files#diff-da43545226f71917e5fefffc9bdffb47fa72d32931412964b3b9ccc8b834e1aeR7 when merged
export const download = async (url: string, filePath: string) => {
  const { body } = await request(url, {
    maxRedirections: 5,
    method: 'GET',
  })

  await new Promise<void>((resolve, reject) => {
    const fileStream = fs.createWriteStream(filePath)

    body.on('error', (error: Error) => {
      reject(error)
    })

    fileStream.on('finish', () => {
      resolve()
    })

    body.pipe(fileStream)
  })
}
