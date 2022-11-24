import { loadTsNode } from './typescript-support';
import { KuaiContext } from './context';
import { KuaiRuntimeEnvironment } from './runtime';
import { loadConfigAndTasks } from './config';
import { KuaiArguments } from './type';

export async function initialKuai(args: KuaiArguments = {}): Promise<KuaiContext> {
  loadTsNode();

  const ctx = KuaiContext.getInstance();

  const config = await loadConfigAndTasks(args);

  const env = new KuaiRuntimeEnvironment(config, ctx.tasksLoader.getTasks(), ctx.extendersManager.getExtenders());
  ctx.setRuntimeEnvironment(env);

  return ctx;
}
