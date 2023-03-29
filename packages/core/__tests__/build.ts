import { jest, describe, it, expect, beforeAll, afterEach } from '@jest/globals'
const mockExec = jest.fn()

jest.mock(
  'node:child_process',
  jest.fn(() => ({
    exec: mockExec,
  })),
)

import type { SimpleTask } from '../src/task'
import { KuaiContext, RuntimeEnvironment, initialKuai } from '../src'

describe('Test build cli', () => {
  let ctx: KuaiContext
  let env: RuntimeEnvironment
  let task: SimpleTask

  beforeAll(async () => {
    ctx = await initialKuai()
    env = ctx.getRuntimeEnvironment()
  })
  describe('build task', () => {
    beforeAll(async () => {
      task = env.tasks['build']
    })

    it('should have build task', async () => {
      expect(task).not.toBeUndefined()
      expect(task.isSubtask).toBeFalsy()
    })

    it('should build server by default', () => {
      expect(task.params.server.defaultValue).toBeTruthy()
    })
  })

  describe('build:server task', () => {
    beforeAll(async () => {
      task = env.tasks['build:server']
    })

    it('should have build:server task', async () => {
      expect(task).not.toBeUndefined()
      expect(task.isSubtask).toBeTruthy()
    })

    it('should call npm run build script', async () => {
      await env.run('build:server')
      expect(mockExec.mock.calls[0][0]).toBe('npm run build')
    })
  })

  describe('build:dev task', () => {
    beforeAll(async () => {
      task = env.tasks['build:dev']
    })

    afterEach(() => {
      mockExec.mockReset()
    })

    it('should have build:dev task', async () => {
      expect(task).not.toBeUndefined()
      expect(task.isSubtask).toBeTruthy()
    })

    it('should call npm run dev script', async () => {
      await env.run('build:dev')
      expect(mockExec.mock.calls[0][0]).toBe('npm run dev')
    })
  })
})
