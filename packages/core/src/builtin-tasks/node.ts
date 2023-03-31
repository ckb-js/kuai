import { task, subtask } from '../config/config-env'
import { paramTypes } from '../params'
import { CkbDockerNetwork } from '@ckb-js/kuai-docker-node'
import { KuaiError } from '@ckb-js/kuai-common'
import { ERRORS } from '../errors-list'
import '../type/runtime'

interface Args {
  port: number
  detached: boolean
  genesisArgs: Array<string>
}

const TERMINATION_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGQUIT']

subtask('node:start', 'start a ckb node')
  .addParam('port', 'The port of the node', 8114, paramTypes.number)
  .addParam('detached', 'Run the node in detached mode', false, paramTypes.boolean)
  .addParam('genesisArgs', 'The genesis args', undefined, paramTypes.string, true, true)
  .setAction(async ({ port, detached, genesisArgs = [] }: Args, env) => {
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

    env.config.network = {
      url: 'http://localhost:' + port,
    }
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
