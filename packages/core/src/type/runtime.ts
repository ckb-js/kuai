// eslint-disable-next-line
export type TaskArguments = any;

export type RunTaskFunction = (name: string, taskArguments?: TaskArguments) => Promise<unknown>;

export type EnvironmentExtender = (env: RuntimeEnvironment) => void;

export interface RuntimeEnvironment {
  readonly tasks: Record<string, Task>;
  readonly run: RunTaskFunction;
}

export interface RunSuperFunction<ArgT extends TaskArguments> {
  (taskArguments?: ArgT): Promise<unknown>;
  isDefined: boolean;
}

export type Promisefy<T> = T extends Promise<infer U> ? U : T;

export type ActionType<ArgsT extends TaskArguments> = (
  taskArgs: ArgsT,
  env: RuntimeEnvironment,
  runSuper: RunSuperFunction<ArgsT>,
) => Promisefy<unknown>;

// eslint-disable-next-line
export interface ArgumentType<T = any> {
  /**
   * Check if argument value is of type <T>.
   *
   * @param argumentValue - value to be validated
   *
   * @throws HH301 if value is not of type <t>
   */
  validate(argumentValue: T): void;
}

export interface ConfigurableTaskDefinition<ArgsT extends TaskArguments = TaskArguments> {
  setDescription(description: string): this;
  setAction(action: ActionType<ArgsT>): this;

  addParam<T>(
    name: string,
    description?: string,
    defaultValue?: T,
    type?: ArgumentType<T>,
    isOptional?: boolean,
    isFlag?: boolean,
  ): this;
}
export interface TaskParam<T> {
  name: string;
  description?: string;
  defaultValue?: T;
  type: ArgumentType<T>;
  isOptional: boolean;
  isFlag: boolean;
}

export interface Task<ArgsT extends TaskArguments = TaskArguments> extends ConfigurableTaskDefinition<ArgsT> {
  readonly name: string;
  readonly description?: string;
  readonly isSubtask: boolean;
  readonly action: ActionType<ArgsT>;

  // eslint-disable-next-line
  readonly params: Record<string, TaskParam<any>>;
}
