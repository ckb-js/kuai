import { loadTsNode } from './typescript-support'
import { KuaiContext } from './context'
import { KuaiRuntimeEnvironment } from './runtime'
import { loadConfigAndTasks } from './config'
import { KuaiArguments } from './type'
import path from 'node:path'
import { PATH } from './constants'
import fs from 'node:fs'

export async function initialKuai(args: KuaiArguments = {}): Promise<KuaiContext> {
  loadTsNode()

  const ctx = KuaiContext.getInstance()

  const config = await loadConfigAndTasks(args)

  const env = new KuaiRuntimeEnvironment(config, ctx.tasksLoader.getTasks(), ctx.extendersManager.getExtenders())
  ctx.setRuntimeEnvironment(env)

  return ctx
}

export const cachePath = (...paths: string[]) => {
  const cachePath = path.resolve(PATH.cache, ...paths)
  if (!fs.existsSync(cachePath)) {
    fs.mkdirSync(cachePath, { recursive: true })
  }
  return cachePath
}

export const configPath = (...paths: string[]) => {
  const configPath = path.resolve(PATH.config, ...paths)
  if (!fs.existsSync(configPath)) {
    fs.mkdirSync(configPath, { recursive: true })
  }
  return configPath
}
