import { describe, expect, test, beforeAll, afterAll } from '@jest/globals'
import { execSync } from 'node:child_process'

describe('kuai cli', () => {
  beforeAll(() => {
    execSync('npm link')
  })

  afterAll(() => {
    execSync('npm unlink -g @kuai/cli')
  })

  test('ckb listening port', () => {
    const output1 = execSync('npx kuai node')
    expect(output1.toString()).toMatch(/ckb running on:\s+8114/)

    const output2 = execSync('npx kuai node --port 9999')
    expect(output2.toString()).toMatch(/ckb running on:\s+9999/)
  })

  describe('--config', () => {
    test('normal case 1', () => {
      const output = execSync('npx kuai demo-task1 --config ./__tests__/__fixtures__/kuai-config-case/kuai.config.ts')
      expect(output.toString()).toMatch(/demo-task1/)
    })

    test('normal case 2', () => {
      const output = execSync('npx kuai demo-task2 --config ./__tests__/__fixtures__/kuai-config-case/kuai.config.ts')
      expect(output.toString()).toMatch(/demo-task2/)
    })

    test('subtask', () => {
      const output = execSync(
        'npx kuai demo-task2 sub --config ./__tests__/__fixtures__/kuai-config-case/kuai.config.ts',
      )
      expect(output.toString()).toMatch(/subtask/)
    })

    test('command not find case', () => {
      expect(() => {
        execSync('npx kuai demo-task3 --config ./__tests__/__fixtures__/kuai-config-case/kuai.config.ts')
      }).toThrow(/unknown command 'demo-task3'/)
    })

    test('missing config file', () => {
      expect(() => {
        execSync('npx kuai --config')
      }).toThrow(/option '--config <path>' argument missing/)
    })

    test('can not find config file', () => {
      expect(() => {
        execSync('npx kuai --config kuai.config.ts')
      }).toThrow(/Cannot find module/)
    })
  })
})
