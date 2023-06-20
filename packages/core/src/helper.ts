import { loadTsNode } from './typescript-support'
import { KuaiContext } from './context'
import { KuaiRuntimeEnvironment } from './runtime'
import { loadConfigAndTasks } from './config'
import { KuaiArguments } from './type'
import path from 'node:path'
import { PATH } from './constants'
import fs from 'node:fs'
import { request } from 'undici'

export async function initialKuai(args: KuaiArguments = {}): Promise<KuaiContext> {
  loadTsNode()

  const ctx = KuaiContext.getInstance()

  const config = await loadConfigAndTasks(args)

  const env = new KuaiRuntimeEnvironment(config, ctx.tasksLoader.getTasks(), ctx.extendersManager.getExtenders())
  ctx.setRuntimeEnvironment(env)

  return ctx
}

export const createPath = (path: string) => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path, { recursive: true })
  }
  return path
}

export const cachePath = (...paths: string[]) => createPath(path.resolve(PATH.cache, ...paths))

export const configPath = (...paths: string[]) => createPath(path.resolve(PATH.config, ...paths))

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
