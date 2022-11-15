#!/usr/bin/env node
import { Command } from 'commander';
import { node } from './commands/node';
import { KuaiContext, KuaiRuntimeEnvironment, loadConfigAndTasks, loadTsNode } from '@kuai/core';

const program = new Command();

program.addCommand(node);

// Todo: parse cli arguments for initial kuai config

// TBD: maybe need check is ts file
loadTsNode();

const ctx = KuaiContext.createKuaiContext();

const { config } = loadConfigAndTasks();

const env = new KuaiRuntimeEnvironment(config, ctx.tasksLoader.getTasks(), ctx.extendersManager.getExtenders());
ctx.setRuntimeEnvironment(env);

Object.values(env.tasks)
  .filter((task) => !task.isSubtask)
  .map((task) => {
    const cmd = new Command(task.name);

    if (task.description) {
      cmd.description(task.description);
    }

    Object.values(task.params).map((param) => {
      cmd.option(param.name, param.description || '', param.type.validate, param.defaultValue);
    });

    // eslint-disable-next-line
    cmd.action(async (args: any) => {
      await env.run(task.name, args);
    });

    program.addCommand(cmd);
  });

program.parse();
