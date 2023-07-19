import type { Config as JestConfig } from 'jest'
import type { ScriptConfig } from '@ckb-lumos/config-manager'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TaskArguments = any

export interface KuaiArguments {
  configPath?: string
  network?: string
  privateKey?: string
}

export interface KuaiConfig {
  devNode?: DevNodeConfig
  kuaiArguments?: KuaiArguments
  network?: string
  ckbChain: NetworkConfig
  jest?: JestConfig
  contract?: ContractConfig
  networks?: {
    [name: string]: NetworkConfig
  }
}

export interface DevNodeConfig {
  builtInContractConfigPath?: string
  builtInContractDownloadBaseUrl?: string
  ckb: {
    version?: string
  }
}

export type ContractConfig = {
  workspace?: string
}

export type HttpNetworkConfig = {
  rpcUrl: string
}

export type NetworkConfig = HttpNetworkConfig & {
  prefix: string
  scripts?: Record<string, ScriptConfig>
}

export type RunTaskFunction<T = unknown> = (name: string, taskArguments?: TaskArguments) => Promise<T>

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
