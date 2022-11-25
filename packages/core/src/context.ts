import { RuntimeEnvironment } from './type'
import { TasksLoader } from './task-loader'
import { ExtenderManager } from './extenders'
import { KuaiError } from './errors'
import { ERRORS } from './errors-list'

export class KuaiContext {
  private static __KuaiContext?: KuaiContext

  public static getInstance(): KuaiContext {
    if (this.__KuaiContext !== undefined) {
      return this.__KuaiContext
    }

    const ctx = new KuaiContext()
    this.__KuaiContext = ctx
    return ctx
  }

  public deleteKuaiContext(): void {
    KuaiContext.__KuaiContext = undefined
  }

  public readonly tasksLoader = new TasksLoader()
  public readonly extendersManager = new ExtenderManager()
  public environment?: RuntimeEnvironment

  public setRuntimeEnvironment(env: RuntimeEnvironment): void {
    if (this.environment !== undefined) {
      throw new KuaiError(ERRORS.GENERAL.RUNTIME_ALREADY_DEFINED)
    }
    this.environment = env
  }

  public getRuntimeEnvironment(): RuntimeEnvironment {
    if (this.environment === undefined) {
      throw new KuaiError(ERRORS.GENERAL.RUNTIME_NOT_DEFINED)
    }
    return this.environment
  }
}
