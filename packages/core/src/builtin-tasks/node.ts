import { task, subtask } from '../config/config-env'
import { paramTypes } from '../params'
import { CKBBinNetwork, CkbDockerNetwork } from '@ckb-js/kuai-docker-node'
import { KuaiError } from '@ckb-js/kuai-common'
import { ERRORS } from '../errors-list'
import '../type/runtime'
import { Indexer, RPC, config } from '@ckb-lumos/lumos'
import { cachePath, configPath, download, osPlatform, packageType } from '../helper'
import path from 'node:path'
import fs from 'fs'
import { scheduler } from 'node:timers/promises'
import { DEFAULT_KUAI_PRIVATE_KEY } from '../constants'
import execSync from 'node:child_process'
import os from 'node:os'
import { CKBNode } from '@ckb-js/kuai-docker-node'

interface Args {
  port: number
  detached: boolean
  genesisArgs: Array<string>
  filePath: string
}

const TERMINATION_SIGNALS = ['SIGINT', 'SIGTERM', 'SIGQUIT']
const BUILTIN_SCRIPTS = ['anyone_can_pay', 'omni_lock', 'simple_udt']
const DEFAULT_BUILTIN_CONTRACT_DOWNLOAD_BASE_URL =
  'https://github.com/ckb-js/ckb-production-scripts/releases/download/scripts'
const DEFAULT_CKB_BIN_DOWNLOAD_BASE_URL = 'https://github.com/nervosnetwork/ckb/releases/download'
const DEFAULT_CKB_BIN_VERSION = 'v0.109.0'

const startBinNode = async (version: string, port: number, genesisArgs: string[]): Promise<CKBNode> => {
  const packageName = `ckb_${version}_${os.machine()}-${osPlatform()}`
  const packageFileName = `${packageName}.${packageType}`

  if (!fs.existsSync(path.resolve(cachePath('ckb', 'bin'), packageName))) {
    await download(
      `${DEFAULT_CKB_BIN_DOWNLOAD_BASE_URL}/${version}/${packageFileName}`,
      path.resolve(cachePath('ckb', 'zip'), `${packageFileName}`),
    )

    execSync.execSync(
      `unzip ${path.resolve(cachePath('ckb', 'zip'), `${packageFileName}`)} -d ${cachePath('ckb', 'bin')}`,
    )
  }

  const network = new CKBBinNetwork()
  network.start({
    ckbPath: cachePath('ckb', 'bin', packageName),
    port: port.toString(),
    detached: true,
    genesisAccountArgs: genesisArgs,
  })

  return network
}

const startDockerNode = async (port: number, detached: boolean, genesisArgs: string[]): Promise<CKBNode> => {
  const network = new CkbDockerNetwork()
  network.start({
    port: port.toString(),
    detached,
    genesisAccountArgs: genesisArgs,
  })

  return network
}

subtask('node:start', 'start a ckb node')
  .addParam('port', 'The port of the node', 8114, paramTypes.number)
  .addParam('detached', 'Run the node in detached mode', false, paramTypes.boolean)
  .addParam('genesisArgs', 'The genesis args', undefined, paramTypes.string, true, true)
  .setAction(async ({ port, detached, genesisArgs = [] }: Args, env) => {
    const node = await (async () => {
      switch (env.config.kuaiArguments?.network) {
        case 'docker-node':
          return await startDockerNode(port, detached, genesisArgs)
        case 'bin-node':
          return await startBinNode(env.config.devNode?.ckb.version ?? DEFAULT_CKB_BIN_VERSION, port, genesisArgs)
        default:
          throw new KuaiError(ERRORS.BUILTIN_TASKS.UNSUPPORTED_NETWORK, {
            var: env.config.kuaiArguments?.network,
          })
      }
    })()

    env.config.network = node.url

    const builtInDirPath = cachePath('built-in')
    for (const script of BUILTIN_SCRIPTS) {
      if (!fs.existsSync(path.join(builtInDirPath, script))) {
        download(
          `${
            env.config.devNode?.builtInContractDownloadBaseUrl ?? DEFAULT_BUILTIN_CONTRACT_DOWNLOAD_BASE_URL
          }/${script}}`,
          path.resolve(builtInDirPath, script),
        )
      }
    }
    await scheduler.wait(20000)
    await node.generateLumosConfig()
    config.initializeConfig(node.lumosConfig)

    await node.deployScripts({
      builtInScriptName: BUILTIN_SCRIPTS,
      configFilePath: env.config.devNode?.builtInContractConfigPath ?? path.resolve(configPath(), 'scripts.json'),
      builtInDirPath,
      indexer: new Indexer(node.url),
      rpc: new RPC(node.url),
      privateKey: env.config.kuaiArguments?.privateKey ?? DEFAULT_KUAI_PRIVATE_KEY,
    })
  })

const stopBinNode = async (version: string, clear: boolean): Promise<void> => {
  const packageName = `ckb_${version}_${os.machine()}-${osPlatform()}`
  const network = new CKBBinNetwork()
  network.stop({ ckbPath: cachePath('ckb', 'bin', packageName), clear })
}

const stopDockerNode = async (): Promise<void> => {
  const network = new CkbDockerNetwork()
  network.stop()
}

subtask('node:stop', 'stop ckb node')
  .addParam('clear', 'clear data when using binary node', false, paramTypes.boolean)
  .setAction(async ({ clear }: { clear: boolean }, env) => {
    switch (env.config.kuaiArguments?.network) {
      case 'docker-node':
        return await stopDockerNode()
      case 'bin-node':
        return await stopBinNode(env.config.devNode?.ckb.version ?? DEFAULT_CKB_BIN_VERSION, clear)
      default:
        throw new KuaiError(ERRORS.BUILTIN_TASKS.UNSUPPORTED_NETWORK, {
          var: env.config.kuaiArguments?.network,
        })
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
