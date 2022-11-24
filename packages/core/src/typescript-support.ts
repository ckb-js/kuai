import { resolveConfigPath } from './config/config-loading'
import { KuaiError } from './errors'
import { ERRORS } from './errors-list'

let cachedIsTypescriptSupported: boolean | undefined

export function isRunningKuaiCoreTests(): boolean {
  return __filename.endsWith('.ts')
}

/**
 * Returns true if Kuai will run in using typescript mode.
 * @param configPath The config path if provider by the user.
 */
export function willRunWithTypescript(configPath?: string): boolean {
  const config = resolveConfigPath(configPath)
  return config ? isTypescriptFile(config) : false
}

export function isTypescriptSupported(): boolean {
  if (cachedIsTypescriptSupported === undefined) {
    try {
      require.resolve('typescript')
      require.resolve('ts-node')
      cachedIsTypescriptSupported = true
    } catch {
      cachedIsTypescriptSupported = false
    }
  }

  return cachedIsTypescriptSupported
}

export function loadTsNode(tsConfigPath?: string, shouldTypecheck = false): void {
  try {
    require.resolve('typescript')
  } catch {
    throw new KuaiError(ERRORS.GENERAL.TYPESCRIPT_NOT_INSTALLED)
  }

  try {
    require.resolve('ts-node')
  } catch {
    throw new KuaiError(ERRORS.GENERAL.TS_NODE_NOT_INSTALLED)
  }

  // If we are running tests we just want to transpile
  if (isRunningKuaiCoreTests()) {
    require('ts-node/register/transpile-only')
    return
  }

  if (tsConfigPath !== undefined) {
    process.env.TS_NODE_PROJECT = tsConfigPath
  }

  if (process.env.TS_NODE_FILES === undefined) {
    process.env.TS_NODE_FILES = 'true'
  }

  let tsNodeRequirement = 'ts-node/register'

  if (!shouldTypecheck) {
    tsNodeRequirement += '/transpile-only'
  }

  require(tsNodeRequirement)
}

function isTypescriptFile(path: string): boolean {
  return path.endsWith('.ts')
}
