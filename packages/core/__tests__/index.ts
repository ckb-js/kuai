import { describe, expect, test } from '@jest/globals'

import { RuntimeEnvironment, Task, TaskMap, KuaiRuntimeEnvironment, paramTypes, ERRORS } from '../src'
import { SimpleTask } from '../src/task'
import { ErrorDescriptor, KuaiError } from '@ckb-js/kuai-common'

declare module '../src/type/runtime' {
  export interface RuntimeEnvironment {
    wheel?: {
      type: string
    }
    engine?: {
      power: number
      type: string
    }
  }
}

const makeTaskMap = (tasks: Task[]): TaskMap => tasks.reduce((prev, task) => ({ ...prev, [task.name]: task }), {})

describe('kuai task system', () => {
  const buildWheelTask = new SimpleTask('BUILD_WHEEL')
    .addParam('wheelType', 'Type of wheel to build', 'steel', paramTypes.string)
    .setAction<{ wheelType: string }>(async ({ wheelType }, env, runSuper) => {
      if (wheelType === 'steel') {
        env.wheel = {
          type: wheelType,
        }
      }

      if (runSuper.isDefined) {
        await runSuper()
      }
    })

  const buildEngineTask = new SimpleTask('BUILD_ENGINE')
    .addParam('engineType', 'Type of engine to build', 'v8', paramTypes.string)
    .addParam('power', 'Power of engine to build', 1000, paramTypes.number)
    .setAction<{ engineType: string; power: number }>(async ({ engineType, power }, env, runSuper) => {
      env.engine = {
        power,
        type: engineType,
      }

      if (runSuper.isDefined) {
        await runSuper()
      }
    })

  const buildCarTask = new SimpleTask('BUILD_CAR')
    .addParam('wheelType', 'Type of wheel to build', 'steel', paramTypes.string)
    .addParam('engineType', 'Type of engine to build', 'v8', paramTypes.string)
    .setAction<{ engineType: string; wheelType: string }>(async (args, env) => {
      env.run('BUILD_WHEEL', { wheelType: args.wheelType })
      env.run('BUILD_ENGINE', { engineType: args.engineType })
    })

  const buildSkidProofWheelTask = new SimpleTask('BUILD_WHEEL').setAction<{ wheelType: string }>(
    async ({ wheelType }, env, runSuper) => {
      if (wheelType === 'skid_proof') {
        env.wheel = {
          type: wheelType,
        }
      }

      if (runSuper.isDefined) {
        await runSuper()
      }
    },
  )

  const environment = new KuaiRuntimeEnvironment(
    {},
    makeTaskMap([buildWheelTask, buildEngineTask, buildCarTask, buildSkidProofWheelTask]),
    [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any as RuntimeEnvironment

  test('should build car with skid proof wheel', () => {
    environment.run('BUILD_CAR', { wheelType: 'skid_proof', engineType: 'v8' })
    expect(environment.wheel?.type).toBe('skid_proof')
  })

  describe('invalid task', () => {
    const buildWheelTask = new SimpleTask('BUILD_WHEEL')
      .addParam('wheelType', 'Type of wheel to build')
      .setAction<{ wheelType: string }>(async ({ wheelType }, env, runSuper) => {
        if (wheelType === 'steel') {
          env.wheel = {
            type: wheelType,
          }
        }

        if (runSuper.isDefined) {
          await runSuper()
        }
      })

    const environment = new KuaiRuntimeEnvironment(
      {},
      makeTaskMap([buildWheelTask]),
      [],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any as RuntimeEnvironment

    test('invalid task name', async () => {
      expectKuaiErrorAsync(() => environment.run('BUILD_WHEEL1', {}), ERRORS.ARGUMENTS.UNRECOGNIZED_TASK)
    })

    test('missing task arguments', async () => {
      expectKuaiErrorAsync(() => environment.run('BUILD_WHEEL', {}), ERRORS.ARGUMENTS.MISSING_TASK_ARGUMENT)
    })
  })
})

export function expectKuaiError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: () => any,
  errorDescriptor: ErrorDescriptor,
  errorMessage?: string | RegExp,
): void {
  try {
    f()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    expect(error).toBeInstanceOf(KuaiError)
    _assertKuaiError(error, errorDescriptor, errorMessage)
    return
  }

  throw new Error(`KuaiError code ${errorDescriptor.code} expected, but no Error was thrown`)
}

export async function expectKuaiErrorAsync(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  f: () => Promise<any>,
  errorDescriptor: ErrorDescriptor,
  errorMessage?: string | RegExp,
): Promise<void> {
  try {
    await f()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    expect(error).toBeInstanceOf(KuaiError)
    _assertKuaiError(error, errorDescriptor, errorMessage)
    return
  }

  throw new Error(`KuaiError code ${errorDescriptor.code} expected, but no Error was thrown`)
}

function _assertKuaiError(error: KuaiError, errorDescriptor: ErrorDescriptor, errorMessage?: string | RegExp): void {
  expect(error.code).toBe(errorDescriptor.code)
  expect(error.message).not.toMatch(/%[a-zA-Z][a-zA-Z0-9]*%/)

  if (typeof errorMessage == 'string') {
    expect(error.message).toContain(errorMessage)
  } else if (errorMessage != undefined) {
    expect(error.message).toMatch(errorMessage)
  }
}
