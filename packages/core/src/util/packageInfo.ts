import findup from 'find-up'
import path from 'node:path'
import fs from 'node:fs'

export function findClosestPackageJson(file: string): string | undefined {
  return findup.sync('package.json', { cwd: path.dirname(file) })
}

export function getPackageJsonPath(): string {
  const packageJsonPath = findClosestPackageJson(__filename)

  if (!packageJsonPath) {
    throw new Error('package.json not found')
  }

  return packageJsonPath
}

export function getPackageRoot(): string {
  const packageJsonPath = getPackageJsonPath()

  return path.dirname(packageJsonPath)
}

export interface PackageJson {
  name: string
  version: string
  engines: {
    node: string
  }
}

export async function getPackageJson(): Promise<PackageJson> {
  const root = getPackageRoot()
  return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'))
}
