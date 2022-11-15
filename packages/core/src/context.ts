import { RuntimeEnvironment } from './type';
import { TasksLoader } from './task-loader';
import { ExtenderManager } from './extenders';

export type GlobalWithKuaiContext = typeof global & {
  __KuaiContext: KuaiContext;
};

export class KuaiContext {
  public static isCreated(): boolean {
    const globalWithKuaiContext = global as GlobalWithKuaiContext;
    return globalWithKuaiContext.__KuaiContext !== undefined;
  }

  public static createKuaiContext(): KuaiContext {
    if (this.isCreated()) {
      throw new Error('context already created');
    }
    const globalWithKuaiContext = global as GlobalWithKuaiContext;
    const ctx = new KuaiContext();
    globalWithKuaiContext.__KuaiContext = ctx;
    return ctx;
  }

  public static getKuaiContext(): KuaiContext {
    const globalWithKuaiContext = global as GlobalWithKuaiContext;
    const ctx = globalWithKuaiContext.__KuaiContext;
    if (ctx === undefined) {
      throw new Error('context not created');
    }
    return ctx;
  }

  public static deleteKuaiContext(): void {
    // eslint-disable-next-line
    const globalAsAny = global as any;
    globalAsAny.__KuaiContext = undefined;
  }

  public readonly tasksLoader = new TasksLoader();
  public readonly extendersManager = new ExtenderManager();
  public environment?: RuntimeEnvironment;

  public setRuntimeEnvironment(env: RuntimeEnvironment): void {
    if (this.environment !== undefined) {
      throw new Error('context already defined');
    }
    this.environment = env;
  }

  public getRuntimeEnvironment(): RuntimeEnvironment {
    if (this.environment === undefined) {
      throw new Error('context not defined');
    }
    return this.environment;
  }
}
