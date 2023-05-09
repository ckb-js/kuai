import { loadTsNode } from './typescript-support'
import { KuaiContext } from './context'
import { KuaiRuntimeEnvironment } from './runtime'
import { loadConfigAndTasks } from './config'
import { KuaiArguments } from './type'
import path from 'node:path'
import { PATH } from './constants'

export async function initialKuai(args: KuaiArguments = {}): Promise<KuaiContext> {
  loadTsNode()

  const ctx = KuaiContext.getInstance()

  const config = await loadConfigAndTasks(args)

  const env = new KuaiRuntimeEnvironment(config, ctx.tasksLoader.getTasks(), ctx.extendersManager.getExtenders())
  ctx.setRuntimeEnvironment(env)

  return ctx
}

export const cachePath = (...paths: string[]) => path.resolve(PATH.cache, ...paths)

export const configPath = (...paths: string[]) => path.resolve(PATH.config, ...paths)

export const dataPath = (...paths: string[]) => path.resolve(PATH.data, ...paths)

export const logPath = (...paths: string[]) => path.resolve(PATH.log, ...paths)
