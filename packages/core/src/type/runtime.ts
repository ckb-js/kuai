// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaskArguments = any

export interface KuaiArguments {
  configPath?: string
  network?: string
}

export interface KuaiConfig {
  kuaiArguments?: KuaiArguments
  network?: HttpNetworkConfig
}

export type HttpNetworkConfig = {
  url: string
}

export type RunTaskFunction = (name: string, taskArguments?: TaskArguments) => Promise<unknown>

export type EnvironmentExtender = (env: RuntimeEnvironment) => void

export interface RuntimeEnvironment {
  // TODO: change to generate type
  readonly config: KuaiConfig
  readonly tasks: Record<string, Task>
  readonly run: RunTaskFunction
}

export interface RunSuperFunction<ArgT extends TaskArguments> {
  (taskArguments?: ArgT): Promise<unknown>
  isDefined: boolean
}

export type ActionType<ArgsT extends TaskArguments> = (
  taskArgs: ArgsT,
  env: RuntimeEnvironment,
  runSuper: RunSuperFunction<ArgsT>,
) => Awaited<unknown>

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ArgumentType<T = any> {
  name: string
  /**
   * Check if argument value is of type <T>.
   *
   * @param argumentValue - value to be validated
   *
   * @throws HH301 if value is not of type <t>
   */
  validate(argumentValue: T): void
}

export interface ConfigurableTaskDefinition<ArgsT extends TaskArguments = TaskArguments> {
  setDescription(description: string): this
  setAction(action: ActionType<ArgsT>): this

  addParam<T>(
    name: string,
    description?: string,
    defaultValue?: T,
    type?: ArgumentType<T>,
    isOptional?: boolean,
    isVariadic?: boolean,
  ): this
}
export interface TaskParam<T = TaskArguments> {
  name: string
  description?: string
  defaultValue?: T
  type: ArgumentType<T>
  isOptional?: boolean
  isVariadic?: boolean
}

export interface Task<ArgsT extends TaskArguments = TaskArguments> extends ConfigurableTaskDefinition<ArgsT> {
  readonly name: string
  readonly description?: string
  readonly isSubtask: boolean
  readonly action: ActionType<ArgsT>

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly params: Record<string, TaskParam<any>>
}

export type TaskMap = Record<string, Task>
