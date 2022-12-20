import findUp from 'find-up'
import path from 'node:path'
import fs from 'node:fs'
import { getPackageRoot } from './util/packageInfo'

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

export async function getRecommendedGitIgnore(): Promise<string> {
  const packageRoot = getPackageRoot()
  const gitIgnorePath = path.join(packageRoot, 'recommended-gitignore.txt')

  return fs.readFileSync(gitIgnorePath, 'utf-8')
}

export async function getRecommendedPackageJson(): Promise<JSON> {
  const packageRoot = getPackageRoot()
  const packageJsonPath = path.join(packageRoot, 'recommended-package.json')

  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
}
