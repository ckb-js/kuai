import { ActionType, ConfigurableTaskDefinition, EnvironmentExtender, TaskArguments } from '../type';
import { KuaiContext } from '../context';

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
export function task<ArgsT extends TaskArguments>(
  name: string,
  description?: string,
  action?: ActionType<ArgsT>,
): ConfigurableTaskDefinition;

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
export function task<ArgsT extends TaskArguments>(name: string, action: ActionType<ArgsT>): ConfigurableTaskDefinition;

export function task<ArgsT extends TaskArguments>(
  name: string,
  descriptionOrAction?: string | ActionType<ArgsT>,
  action?: ActionType<ArgsT>,
): ConfigurableTaskDefinition {
  const ctx = KuaiContext.getInstance();
  const loader = ctx.tasksLoader;

  if (descriptionOrAction === undefined) {
    return loader.task(name);
  }

  if (typeof descriptionOrAction !== 'string') {
    return loader.task(name, descriptionOrAction);
  }

  return loader.task(name, descriptionOrAction, action);
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
export function subtask<ArgsT extends TaskArguments>(
  name: string,
  description?: string,
  action?: ActionType<ArgsT>,
): ConfigurableTaskDefinition;

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
export function subtask<ArgsT extends TaskArguments>(
  name: string,
  action: ActionType<ArgsT>,
): ConfigurableTaskDefinition;

export function subtask<ArgsT extends TaskArguments>(
  name: string,
  descriptionOrAction?: string | ActionType<ArgsT>,
  action?: ActionType<ArgsT>,
): ConfigurableTaskDefinition {
  const ctx = KuaiContext.getInstance();
  const loader = ctx.tasksLoader;

  if (descriptionOrAction === undefined) {
    return loader.subtask(name);
  }

  if (typeof descriptionOrAction !== 'string') {
    return loader.subtask(name, descriptionOrAction);
  }

  return loader.subtask(name, descriptionOrAction, action);
}

/**
 * Register an environment extender what will be run after the
 * Runtime Environment is initialized.
 *
 * @param extender A function that receives the Runtime Environment.
 */
export function extendEnvironment(extender: EnvironmentExtender): void {
  const ctx = KuaiContext.getInstance();
  const extenderManager = ctx.extendersManager;
  extenderManager.add(extender);
}
