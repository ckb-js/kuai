import { RuntimeEnvironment } from './type';
import { TasksLoader } from './task-loader';
import { ExtenderManager } from './extenders';
import { KuaiError } from './errors';
import { ERRORS } from './errors-list';

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
      throw new KuaiError(ERRORS.GENERAL.CONTEXT_ALREADY_CREATED);
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
      throw new KuaiError(ERRORS.GENERAL.CONTEXT_NOT_CREATED);
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
      throw new KuaiError(ERRORS.GENERAL.RUNTIME_ALREADY_DEFINED);
    }
    this.environment = env;
  }

  public getRuntimeEnvironment(): RuntimeEnvironment {
    if (this.environment === undefined) {
      throw new KuaiError(ERRORS.GENERAL.RUNTIME_NOT_DEFINED);
    }
    return this.environment;
  }
}
