import { ActionType, TaskArguments, Task, TaskMap } from './type';

import { OverrideTask, SimpleTask } from './task';

export class TasksLoader {
  public readonly internalTask = this.subtask;

  private readonly _tasks: TaskMap = {};

  /**
   * Creates a task, overriding any previous task with the same name.
   *
   * @remarks The action must await every async call made within it.
   *
   * @param name The task's name.
   * @param description The task's description.
   * @param action The task's action.
   * @returns A task definition.
   */
  public task<ArgsT extends TaskArguments>(name: string, description?: string, action?: ActionType<ArgsT>): Task;

  /**
   * Creates a task without description, overriding any previous task
   * with the same name.
   *
   * @remarks The action must await every async call made within it.
   *
   * @param name The task's name.
   * @param action The task's action.
   *
   * @returns A task definition.
   */
  public task<ArgsT extends TaskArguments>(name: string, action: ActionType<ArgsT>): Task;

  public task<ArgsT extends TaskArguments>(
    name: string,
    descriptionOrAction?: string | ActionType<ArgsT>,
    action?: ActionType<ArgsT>,
  ): Task {
    return this._addTask(name, descriptionOrAction, action, false);
  }

  /**
   * Creates a subtask, overriding any previous task with the same name.
   *
   * @remarks The subtasks won't be displayed in the CLI help messages.
   * @remarks The action must await every async call made within it.
   *
   * @param name The task's name.
   * @param description The task's description.
   * @param action The task's action.
   * @returns A task definition.
   */
  public subtask<ArgsT extends TaskArguments>(name: string, description?: string, action?: ActionType<ArgsT>): Task;

  /**
   * Creates a subtask without description, overriding any previous
   * task with the same name.
   *
   * @remarks The subtasks won't be displayed in the CLI help messages.
   * @remarks The action must await every async call made within it.
   *
   * @param name The task's name.
   * @param action The task's action.
   * @returns A task definition.
   */
  public subtask<ArgsT extends TaskArguments>(name: string, action: ActionType<ArgsT>): Task;
  public subtask<ArgsT extends TaskArguments>(
    name: string,
    descriptionOrAction?: string | ActionType<ArgsT>,
    action?: ActionType<ArgsT>,
  ): Task {
    return this._addTask(name, descriptionOrAction, action, true);
  }

  /**
   * Retrieves the task definitions.
   *
   * @returns The tasks container.
   */
  public getTasks(): TaskMap {
    return this._tasks;
  }

  private _addTask<ArgT extends TaskArguments>(
    name: string,
    descriptionOrAction?: string | ActionType<ArgT>,
    action?: ActionType<ArgT>,
    isSubtask?: boolean,
  ) {
    ``;
    const parentTask = this._tasks[name];

    let task: Task;

    if (parentTask !== undefined) {
      task = new OverrideTask(parentTask, isSubtask);
    } else {
      task = new SimpleTask(name, isSubtask);
    }

    if (descriptionOrAction instanceof Function) {
      action = descriptionOrAction;
      descriptionOrAction = undefined;
    }

    if (descriptionOrAction !== undefined) {
      task.setDescription(descriptionOrAction);
    }

    if (action !== undefined) {
      task.setAction(action);
    }

    this._tasks[name] = task;
    return task;
  }
}
