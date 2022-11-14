import { RuntimeEnvironment, RunTaskFunction, TaskArguments, Task, TaskParam, EnvironmentExtender } from './type';
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

    const taskArgs = this._resolveValidTaskArgs(task, taskArguments);

    return this._runTask(task, taskArgs);
  };

  private readonly _runTask = async (task: Task, taskArguments: TaskArguments): Promise<unknown> => {
    // eslint-disable-next-line
    let runSuper: any = () => Promise.resolve();
    runSuper.isDefined = false;

    if (task instanceof OverrideTask) {
      runSuper = this._runTask(task.parentTask, taskArguments);
      runSuper.isDefined = true;
    }

    return task.action(taskArguments, this, runSuper);
  };

  private _resolveValidTaskArgs(task: Task, taskArgs: TaskArguments): TaskArguments {
    const { params } = task;
    const paramList = Object.values(params);

    const initResolvedArgs: {
      errors: Error[];
      args: TaskArguments;
    } = { errors: [], args: {} };

    const resolvedArgs = paramList.reduce(({ errors, args }, param) => {
      try {
        const paramName = param.name;
        const argValue = taskArgs[paramName];
        const resolvedArgValue = this._resolveArgument(param, argValue);
        if (resolvedArgValue != undefined) {
          args[paramName] = resolvedArgValue;
        }
      } catch (error) {
        // todo: format error
        errors.push(new Error('invalid task args'));
      }
      return { errors, args };
    }, initResolvedArgs);

    const { errors: resolveErrors, args: resolvedValues } = resolvedArgs;

    if (resolveErrors.length > 0) {
      throw resolveErrors[0];
    }

    const resolvedTaskArgs = { ...taskArgs, ...resolvedValues };

    return resolvedTaskArgs;
  }

  // eslint-disable-next-line
  private _resolveArgument(param: TaskParam<any>, argValue: any) {
    const { isOptional, defaultValue } = param;

    if (argValue == undefined) {
      if (isOptional) {
        return defaultValue;
      }

      // todo: format error
      throw new Error('invalid task args');
    }

    this._checkTypeValid(param, argValue);

    return argValue;
  }

  // eslint-disable-next-line
  private _checkTypeValid(param: TaskParam<any>, argValue: any) {
    const { type } = param;

    type.validate(argValue);
  }
}
