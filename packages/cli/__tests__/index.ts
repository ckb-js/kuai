import { describe, expect, test, beforeAll, afterAll } from '@jest/globals'
import { execSync } from 'node:child_process'
const CONFIG_PATH = './__tests__/__fixtures__/kuai-config-case/kuai.config.ts'

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
    test('normal case', () => {
      const output = execSync('npx kuai hello')
      expect(output.toString()).toMatch(/hello alice/)
    })

    test('normal case 1', () => {
      const output = execSync(`npx kuai demo-task1 --config ${CONFIG_PATH}`)
      expect(output.toString()).toMatch(/demo-task1/)
    })

    test('normal case 2', () => {
      const output = execSync(`npx kuai demo-task2 --config ${CONFIG_PATH}`)
      expect(output.toString()).toMatch(/demo-task2/)
    })

    test('subtask', () => {
      const output = execSync(`npx kuai demo-task2 sub --config ${CONFIG_PATH}`)
      expect(output.toString()).toMatch(/subtask/)
    })

    test('command not find case', () => {
      expect(() => {
        execSync(`npx kuai demo-task3 --config ${CONFIG_PATH}`)
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

  describe('task arguments', () => {
    test('task missing required params', () => {
      expect(() => {
        execSync(`npx kuai required-task --config ${CONFIG_PATH}`)
      }).toThrow(/The 'paramA' parameter expects a value, but none was passed./)
    })

    test('task pass wrong params type', () => {
      expect(() => {
        execSync(`npx kuai --config ${CONFIG_PATH} required-task --paramA text`)
      }).toThrow(/Invalid value NaN for argument paramA of type number/)
    })

    test('boolean param task', () => {
      const output = execSync(`npx kuai --config ${CONFIG_PATH} boolean-param-task --test`)
      expect(output.toString()).toMatch(/true/)

      const falseOutput = execSync(`npx kuai --config ${CONFIG_PATH} boolean-param-task`)
      expect(falseOutput.toString()).toMatch(/false/)
    })

    test('normal case', () => {
      const output = execSync(`npx kuai --config ${CONFIG_PATH} required-task --paramA 1`)
      expect(output.toString()).toMatch(/required-task/)
    })
  })

  describe('test variadic param task', () => {
    test('not pass variadic param', () => {
      expect(() => {
        execSync(`npx kuai --config ${CONFIG_PATH} variadic-task`)
      }).toThrow(/The 'variadicParam' parameter expects a value, but none was passed./)
    })

    test('pass wrong type variadic param', () => {
      expect(() => {
        execSync(`npx kuai --config ${CONFIG_PATH} variadic-task --variadicParam text`)
      }).toThrow(/Invalid value NaN for argument variadicParam of type number/)
    })

    test('pass multiple variadic param', () => {
      const output = execSync(`npx kuai --config ${CONFIG_PATH} variadic-task --variadicParam 1 2`)
      expect(output.toString()).toMatch('{ variadicParam: [ 1, 2 ] }')
    })
  })
})
