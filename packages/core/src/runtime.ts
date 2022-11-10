import { RuntimeEnvironment, RunTaskFunction, TaskArguments, Task, EnvironmentExtender } from './type';
import { OverrideTask } from './task';

export class KuaiRuntimeEnvironment implements RuntimeEnvironment {
  public readonly tasks: Record<string, Task>;

  constructor(config: unknown, tasks: Task[], private readonly extenders: EnvironmentExtender[]) {
    this.tasks = tasks.reduce((acc, task) => ({ ...acc, [task.name]: task }), {});

    this.extenders.forEach((extender) => extender(this));
  }

  public readonly run: RunTaskFunction = async (name, taskArguments = {}) => {
    const task = this.tasks[name];
    if (!task) {
      throw new Error(`Task ${name} is not defined`);
    }

    return this._runTask(task, taskArguments);
  };

  private readonly _runTask = async (task: Task, taskArguments: TaskArguments): Promise<unknown> => {
    // todo: validate args

    // eslint-disable-next-line
    let runSuper: any = () => Promise.resolve();
    runSuper.isDefined = false;

    if (task instanceof OverrideTask) {
      task.parentTask;
      runSuper = this._runTask(task.parentTask, taskArguments);
      runSuper.isDefined = true;
    }

    return task.action(taskArguments, this, runSuper);
  };
}
