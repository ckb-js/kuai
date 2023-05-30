import path from 'node:path'
import { KuaiError } from '@ckb-js/kuai-common'
import { KuaiConfig, KuaiArguments } from '../type'
import { getUserConfigPath } from '../project-structure'
import { ERRORS } from '../errors-list'
import { DEFAULT_KUAI_ARGUMENTS, DEFAULT_NETWORKDS } from '../constants'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function importCsjOrEsModule(filePath: string): any {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const imported = require(filePath)
  return imported.default !== undefined ? imported.default : imported
}

export function resolveConfigPath(configPath: string | undefined): string | undefined {
  if (configPath === undefined) {
    return getUserConfigPath()
  }

  if (!path.isAbsolute(configPath)) {
    configPath = path.join(process.cwd(), configPath)
    configPath = path.normalize(configPath)
  }

  return configPath
}

export async function loadConfigAndTasks(args: KuaiArguments = {}): Promise<KuaiConfig> {
  const configPath = resolveConfigPath(args.configPath)

  await import('../builtin-tasks')

  let userConfig

  if (configPath) {
    userConfig = importCsjOrEsModule(configPath)
  }

  const config: KuaiConfig = {
    networks: DEFAULT_NETWORKDS,
    ...userConfig,
    kuaiArguments: {
      ...args,
      configPath,
    },
  }

  const specificNetwork = config.kuaiArguments?.network || config.network || DEFAULT_KUAI_ARGUMENTS.network

  const ckbChain = config.networks?.[specificNetwork]

  if (!ckbChain) {
    throw new KuaiError(ERRORS.GENERAL.NETWORK_NOT_FOUND)
  }

  return {
    ...config,
    ckbChain,
  }
}
