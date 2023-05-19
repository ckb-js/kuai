import { task, subtask } from '../config/config-env'
import { paramTypes } from '../params'
import { CkbDockerNetwork } from '@ckb-js/kuai-docker-node'
import { KuaiError } from '@ckb-js/kuai-common'
import { ERRORS } from '../errors-list'
import '../type/runtime'
import { Indexer, RPC, config } from '@ckb-lumos/lumos'
import { cachePath, configPath } from '../helper'
import path from 'node:path'
import fs from 'fs'
import { scheduler } from 'node:timers/promises'
import undici from 'undici'

interface Args {
  port: number
  detached: boolean
  genesisArgs: Array<string>
  filePath: string
}

const TERMINATION_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGQUIT']
const BUILTIN_SCRIPTS = ['anyone_can_pay', 'omni_lock', 'simple_udt']

subtask('node:start', 'start a ckb node')
  .addParam('port', 'The port of the node', 8114, paramTypes.number)
  .addParam('detached', 'Run the node in detached mode', false, paramTypes.boolean)
  .addParam('filePath', 'The script config file path', undefined, paramTypes.string, true, true)
  .addParam('genesisArgs', 'The genesis args', undefined, paramTypes.string, true, true)
  .setAction(async ({ port, detached, filePath, genesisArgs = [] }: Args, env) => {
    if (env.config.kuaiArguments?.network !== 'docker-node') {
      throw new KuaiError(ERRORS.BUILTIN_TASKS.UNSUPPORTED_NETWORK, {
        var: env.config.kuaiArguments?.network,
      })
    }

    const ckbDockerNetwork = new CkbDockerNetwork()
    ckbDockerNetwork.start({
      port: port.toString(),
      detached,
      genesisAccountArgs: genesisArgs,
    })

    env.config.network = ckbDockerNetwork.url

    const builtInDirPath = cachePath('built-in')
    for (const script of BUILTIN_SCRIPTS) {
      const filePath = path.join(builtInDirPath, script)
      if (!fs.existsSync(filePath)) {
        const out = fs.createWriteStream(path.resolve(builtInDirPath, script))
        await undici.stream(
          `https://github.com/Daryl-L/ckb-production-scripts/releases/download/scripts/${script}`,
          {
            opaque: out,
            method: 'GET',
          },
          ({ opaque }) => opaque as fs.WriteStream,
        )
      }
    }
    await scheduler.wait(20000)
    await ckbDockerNetwork.generateLumosConfig()
    config.initializeConfig(ckbDockerNetwork.lumosConfig)

    await ckbDockerNetwork.deployScripts({
      builtInScriptName: BUILTIN_SCRIPTS,
      configFilePath: filePath ?? path.resolve(configPath(), 'scripts.json'),
      builtInDirPath,
      indexer: new Indexer(ckbDockerNetwork.url),
      rpc: new RPC(ckbDockerNetwork.url),
      privateKey: '0xfd686a48908e8caf97723578bf85f746e1e1d8956cb132f6a2e92e7234a2a245',
    })
  })

subtask('node:stop', 'stop ckb node').setAction(async (_, env) => {
  if (env.config.kuaiArguments?.network === 'docker-node') {
    const ckbDockerNetwork = new CkbDockerNetwork()
    ckbDockerNetwork.stop()
  }
})

task('node')
  .setDescription('run a ckb node for develop')
  .addParam('port', 'port number', 8114, paramTypes.number)
  .addParam('detached', 'run in backend', false, paramTypes.boolean)
  .addParam('genesisArgs', 'The genesis args', undefined, paramTypes.string, true, true)
  .setAction(async (args: Args, env) => {
    TERMINATION_SIGNALS.forEach((signal) =>
      process.on(signal, async () => {
        await env.run('node:stop', args)
      }),
    )

    await env.run('node:start', args)
  })
