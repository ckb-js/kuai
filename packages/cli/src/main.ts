#!/usr/bin/env node
import { Command, createOption, Option } from 'commander';
import { node } from './commands/node';
import { TaskParam, TaskArguments, initialKuai, ERRORS, KuaiError } from '@kuai/core';
import { KUAI_GLOBAL_PARAMS } from '@kuai/core/lib/params';

function parseTaskParams(param: TaskParam<TaskArguments>): Option {
  return createOption(`--${param.name} <${param.type.name}>`, param.description);
}

const program = new Command();

Object.values(KUAI_GLOBAL_PARAMS)
  .map((param) => parseTaskParams(param))
  .map((option) => program.addOption(option));

program.addCommand(node);

const config = () => {
  let path;
  for (let i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === '--config') {
      if (i == process.argv.length - 1) {
        throw new KuaiError(ERRORS.ARGUMENTS.MISSING_CONFIG_FILE);
      }
      path = process.argv[i + 1];
      break;
    }
  }

  if (path === undefined) {
    return {};
  }
  return { config: path };
};

const ctx = initialKuai(config());
const env = ctx.getRuntimeEnvironment();
Object.values(env.tasks)
  .filter((task) => !task.isSubtask)
  .map((task) => {
    const cmd = new Command(task.name);

    if (task.description) {
      cmd.description(task.description);
    }

    Object.values(task.params)
      .map((param) => parseTaskParams(param))
      .map((option) => cmd.addOption(option));

    // eslint-disable-next-line
    cmd.action(async (args: any) => {
      await env.run(task.name, args);
    });

    program.addCommand(cmd);
  });

program.parse();
