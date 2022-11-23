import {
  RuntimeEnvironment,
  RunTaskFunction,
  TaskArguments,
  Task,
  TaskParam,
  EnvironmentExtender,
  KuaiConfig,
  TaskMap,
} from './type';
import { OverrideTask } from './task';
import { KuaiError } from './errors';
import { ERRORS } from './errors-list';

export class KuaiRuntimeEnvironment implements RuntimeEnvironment {
  constructor(
    public readonly config: KuaiConfig,
    public readonly tasks: TaskMap,
    private readonly extenders: EnvironmentExtender[],
  ) {
    this.extenders.forEach((extender) => extender(this));
  }

  public readonly run: RunTaskFunction = async (name, taskArguments = {}) => {
    const task = this.tasks[name];
    if (!task) {
      throw new KuaiError(ERRORS.ARGUMENTS.UNRECOGNIZED_TASK, { task: name });
    }

    const taskArgs = this._resolveValidTaskArgs(task, taskArguments);

    return this._runTask(task, taskArgs);
  };

  private readonly _runTask = async (task: Task, taskArguments: TaskArguments): Promise<unknown> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      errors: KuaiError[];
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
        if (KuaiError.isKuaiError(error)) {
          errors.push(error);
        }
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _resolveArgument(param: TaskParam<any>, argValue: any) {
    const { name, isOptional, defaultValue } = param;

    if (argValue === undefined) {
      if (isOptional) {
        return defaultValue;
      }

      throw new KuaiError(ERRORS.ARGUMENTS.MISSING_TASK_ARGUMENT, {
        param: name,
      });
    }

    this._checkTypeValid(param, argValue);

    return argValue;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _checkTypeValid(param: TaskParam<any>, argValue: any) {
    const { type } = param;

    type.validate(argValue);
  }
}
