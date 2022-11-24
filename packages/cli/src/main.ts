#!/usr/bin/env node
import { Command } from 'commander'
import { node } from './commands/node'

const program = new Command()

program.addCommand(node)
program.parse()
