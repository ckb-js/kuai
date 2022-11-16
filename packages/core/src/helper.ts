import { loadTsNode } from './typescript-support';
import { KuaiContext } from './context';
import { KuaiRuntimeEnvironment } from './runtime';
import { loadConfigAndTasks } from './config';
import { KuaiArguments } from './type';

export function initialKuai(args: KuaiArguments = {}): KuaiContext {
  // TBD: maybe need check is ts file
  loadTsNode();

  const ctx = KuaiContext.createKuaiContext();

  const { config } = loadConfigAndTasks(args);

  const env = new KuaiRuntimeEnvironment(config, ctx.tasksLoader.getTasks(), ctx.extendersManager.getExtenders());
  ctx.setRuntimeEnvironment(env);

  return ctx;
}
