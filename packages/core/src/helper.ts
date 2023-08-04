import { willRunWithTypescript, loadTsNode } from './typescript-support'
import { KuaiContext } from './context'
import { KuaiRuntimeEnvironment } from './runtime'
import { loadConfigAndTasks } from './config'
import { KuaiArguments } from './type'

export async function initialKuai(args: KuaiArguments = {}): Promise<KuaiContext> {
  const ctx = KuaiContext.getInstance()

  if (willRunWithTypescript(args.configPath)) {
    loadTsNode()
  }

  const config = await loadConfigAndTasks(args)

  const env = new KuaiRuntimeEnvironment(config, ctx.tasksLoader.getTasks(), ctx.extendersManager.getExtenders())
  ctx.setRuntimeEnvironment(env)

  return ctx
}
