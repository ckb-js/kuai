#!/usr/bin/env node
import { Command, createOption, Option } from 'commander'
import { TaskParam, TaskArguments, initialKuai, paramTypes, KuaiArguments } from '@ckb-js/kuai-core'

const KUAI_GLOBAL_PARAMS: Array<TaskParam> = [
  {
    name: 'config',
    description: 'a kuai config file.',
    type: paramTypes.path,
    isOptional: false,
  },
  {
    name: 'network',
    description: 'The network to connect to.',
    type: paramTypes.string,
    isOptional: false,
  },
]

function parseTaskParams(param: TaskParam<TaskArguments>): Option {
  const wrapper = (content: string) => (param.isOptional ? `[${content}]` : `<${content}>`)
  const suffix = param.isVariadic ? '...' : ''
  const type = param.type.name === 'boolean' ? '' : ` ${wrapper(param.type.name + suffix)}`

  const option = createOption(`--${param.name}${type}`, param.description)
  if (param.defaultValue !== undefined) {
    option.default(param.defaultValue)
  }

  if (param.type.name === 'number') {
    option.argParser((value, pre) =>
      option.variadic ? (Array.isArray(pre) ? pre : []).concat([Number(value)]) : Number(value),
    )
  }

  return option
}

const main = async () => {
  const program = new Command()

  KUAI_GLOBAL_PARAMS.map((param) => parseTaskParams(param)).forEach((option) => program.addOption(option))

  const args: KuaiArguments = (() => {
    const result: KuaiArguments = {}

    const configPathFlagIndex = process.argv.slice(0, -1).lastIndexOf('--config')
    if (configPathFlagIndex !== -1) {
      Object.assign(result, { configPath: process.argv[configPathFlagIndex + 1] })
    }

    const networkFlagIndex = process.argv.slice(0, -1).lastIndexOf('--network')
    if (networkFlagIndex !== -1) {
      Object.assign(result, { network: process.argv[networkFlagIndex + 1] })
    }

    return result
  })()

  const ctx = await initialKuai(args)
  const env = ctx.getRuntimeEnvironment()
  Object.values(env.tasks)
    .filter((task) => !task.isSubtask)
    .forEach((task) => {
      const cmd = new Command(task.name)

      if (task.description) {
        cmd.description(task.description)
      }

      Object.values(task.params)
        .map((param) => parseTaskParams(param))
        .forEach((option) => cmd.addOption(option))

      cmd.action(async (args) => {
        await env.run(task.name, args)
      })

      program.addCommand(cmd)
    })

  Object.values(env.tasks)
    .filter((task) => task.isSubtask)
    .forEach((subTask) => {
      const parentTaskName = subTask.name.split(':')[0]
      const taskName = subTask.name.split(':')[1]

      const parentCommand = program.commands.find((cmd) => cmd.name() === parentTaskName)
      if (!parentCommand) {
        return
      }

      const cmd = new Command(taskName)

      if (subTask.description) {
        cmd.description(subTask.description)
      }

      Object.values(subTask.params)
        .map((param) => parseTaskParams(param))
        .forEach((option) => cmd.addOption(option))

      cmd.action(async (args) => {
        await env.run(subTask.name, args)
      })

      parentCommand.addCommand(cmd)
    })

  program.parse()
}

main()
