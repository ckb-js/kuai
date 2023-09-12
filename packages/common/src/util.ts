import type { TransactionWithStatus } from '@ckb-lumos/base'
import type { RPC } from '@ckb-lumos/lumos'
import { scheduler } from 'node:timers/promises'
import path from 'node:path'
import fs from 'node:fs'
import { PATH } from './constant'
import { pipeline } from 'node:stream/promises'
import findup from 'find-up'

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

export const downloadFile = async (url: RequestInfo | globalThis.URL, filePath: string) =>
  await pipeline(
    await fetch(url, { method: 'GET' }).then((res) => {
      if (res.body) {
        return res.body! as unknown as NodeJS.ReadableStream
      } else {
        throw new Error('No body in response')
      }
    }),
    fs.createWriteStream(filePath),
  ).catch((e) => {
    console.error('Error downloading file:', e)
  })

export function findClosestPackageJson(file: string): string | undefined {
  return findup.sync('package.json', { cwd: path.dirname(file) })
}

export function getPackageJsonPath(): string {
  const packageJsonPath = findClosestPackageJson(__filename)

  if (!packageJsonPath) {
    throw new Error('package.json not found')
  }

  return packageJsonPath
}

export function getPackageRoot(): string {
  const packageJsonPath = getPackageJsonPath()

  return path.dirname(packageJsonPath)
}

export interface PackageJson {
  name: string
  version: string
  engines: {
    node: string
  }
}

export async function getPackageJson(): Promise<PackageJson> {
  const root = getPackageRoot()
  return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'))
}
