import { Task, ActionType, TaskArguments, TaskParam, ArgumentType } from './type'
import { paramTypes } from './params'

export class SimpleTask implements Task {
  public description?: string
  public action: ActionType<TaskArguments>
  readonly params: Record<string, TaskParam<TaskArguments>> = {}

  constructor(public readonly name: string, public readonly isSubtask: boolean = false) {
    this.action = () => {
      throw new Error('Not implemented')
    }
  }

  public setDescription(description: string): this {
    this.description = description
    return this
  }

  public setAction<ArgsT extends TaskArguments>(action: ActionType<ArgsT>): this {
    this.action = action
    return this
  }

  public addParam<T>(
    name: string,
    description?: string,
    defaultValue?: T,
    type?: ArgumentType<T>,
    isOptional: boolean = defaultValue !== undefined,
    isVariadic = false,
  ): this {
    this.params[name] = {
      name,
      defaultValue,
      type: type || paramTypes.string,
      description,
      isOptional,
      isVariadic,
    }

    return this
  }
}

export class OverrideTask implements Task {
  private _description?: string
  private _action?: ActionType<TaskArguments>

  constructor(public readonly parentTask: Task, public readonly isSubtask: boolean = false) {}

  public setDescription(description: string): this {
    this._description = description
    return this
  }

  public setAction<ArgsT extends TaskArguments>(action: ActionType<ArgsT>): this {
    this._action = action
    return this
  }

  public get name(): string {
    return this.parentTask.name
  }

  public get description(): string | undefined {
    if (this._description !== undefined) {
      return this._description
    }

    return this.parentTask.description
  }

  public get action(): ActionType<TaskArguments> {
    if (this._action !== undefined) {
      return this._action
    }

    return this.parentTask.action
  }

  public get params(): Record<string, TaskParam<TaskArguments>> {
    return this.parentTask.params
  }

  public addParam<T>(
    name: string,
    description?: string,
    defaultValue?: T,
    type?: ArgumentType<T>,
    isOptional?: boolean,
  ): this {
    if (isOptional === undefined || !isOptional) {
      throw new Error('Cannot add required params to an overridden task')
    }

    this.parentTask.addParam(name, description, defaultValue, type, true)
    return this
  }
}
