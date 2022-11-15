import { Command } from 'commander';

interface Args {
  port: number;
}

const node = new Command('node');
node.option('-p --port <number>', 'port number', '8114');
node.action((args: Args) => {
  console.log(`ckb running on: ${args.port}`);
});

export { node };
