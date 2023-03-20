import { runCLI } from '@jest/core'
import type { Config as JestConfig } from 'jest'
import path from 'node:path'
import type { AggregatedResult } from '@jest/test-result'
import { task, subtask } from '../config/config-env'
import { paramTypes } from '../params'
import { getUserConfigPath } from '../project-structure'

interface Args {
  projectRootPath: string
}

subtask('test:get-project-root')
  .addParam('projectRootPath', 'The Root of testing project', '', paramTypes.path, true)
  .setAction(async ({ projectRootPath }: Args, _) => {
    if (projectRootPath) {
      return projectRootPath
    }

    const userConfigPath = getUserConfigPath()

    if (userConfigPath) {
      return path.dirname(userConfigPath)
    }

    return '.'
  })

subtask('test:setup-test-environment').setAction(() => {
  // for expansibility
  // run ckb node or do anything if need
})

subtask('test:run-jest-tests')
  .addParam('projectRootPath', 'The Root of testing project')
  .setAction(async ({ projectRootPath }: Args, { config }) => {
    const jestConfig: JestConfig = { ...config.jest }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return runCLI(jestConfig as any, [projectRootPath])
  })

task('test', 'run jest test')
  .addParam('projectRootPath', 'The Root of testing project', '', paramTypes.path, true)
  .setAction(async ({ projectRootPath }: Args, env) => {
    const realPath = await env.run('test:get-project-root', { projectRootPath })
    await env.run('test:setup-test-environment')
    const result = (await env.run('test:run-jest-tests', { projectRootPath: realPath })) as AggregatedResult
    if (!result.success) {
      process.exitCode = result.numFailedTests
    }
  })
