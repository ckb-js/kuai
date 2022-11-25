import findUp from 'find-up'

const JS_CONFIG_FILENAME = 'kuai.config.js'
const TS_CONFIG_FILENAME = 'kuai.config.ts'

export function isCwdInsideProject(): boolean {
  return findUp.sync(TS_CONFIG_FILENAME) !== null || findUp.sync(JS_CONFIG_FILENAME) !== null
}

export function getUserConfigPath(): string | undefined {
  const tsConfigPath = findUp.sync(TS_CONFIG_FILENAME)
  if (tsConfigPath) {
    return tsConfigPath
  }

  const pathToConfigFile = findUp.sync(JS_CONFIG_FILENAME)

  return pathToConfigFile
}
