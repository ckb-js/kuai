import type { TransactionWithStatus } from '@ckb-lumos/base'
import type { RPC } from '@ckb-lumos/lumos'
import type { URL, UrlObject } from 'node:url'
import { scheduler } from 'node:timers/promises'
import path from 'node:path'
import fs from 'node:fs'
import { PATH } from './constant'
import undici from 'undici'

const MAX_REDIRECTS = 5

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

export async function downloadFile(url: string | URL | UrlObject, filePath: string) {
  try {
    const { body } = await undici.request(url, { method: 'GET', maxRedirections: MAX_REDIRECTS })

    const fileStream = fs.createWriteStream(filePath)

    await new Promise((res, rej) => {
      body
        .pipe(fileStream)
        .on('finish', () => {
          fileStream.close()
          res(0)
        })
        .on('error', (error) => {
          rej(error)
        })
    })
  } catch (error) {
    console.error('Error downloading file:', error)
  }
}
