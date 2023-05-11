import { describe, expect, test, beforeAll, afterAll } from '@jest/globals'
import { execSync } from 'node:child_process'
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const { scheduler } = require('node:timers/promises')
const CONFIG_PATH = './__tests__/__fixtures__/kuai-config-case/kuai.config.ts'

describe('kuai cli', () => {
  beforeAll(async () => {
    execSync('npm link')
    execSync(
      'npx kuai node --port 9002 --detached --genesisArgs 0x0000000000000000000000000000000000000000 0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    )
    await scheduler.wait(10000)
  }, 30000)

  afterAll(() => {
    execSync('npx kuai node stop')
    execSync('npm unlink -g @ckb-js/kuai-cli')
  })

  test('ckb node listening port', async () => {
    const res = await fetch('http://localhost:9002/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 0,
        jsonrpc: '2.0',
        method: 'get_tip_header',
        params: [],
      }),
    })

    expect(res.status).toEqual(200)

    const data = await res.json()
    expect(typeof data.result.number).toEqual('string')
    expect(typeof data.result.hash).toEqual('string')
  })

  test('ckb node accept genesis accounts', async () => {
    const res = await fetch('http://localhost:9002/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        {
          id: 0,
          jsonrpc: '2.0',
          method: 'get_cells',
          params: [
            {
              script: {
                code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
                hash_type: 'type',
                args: '0x0000000000000000000000000000000000000000',
              },
              script_type: 'lock',
            },
            'asc',
            '0x64',
          ],
        },
        {
          id: 0,
          jsonrpc: '2.0',
          method: 'get_cells',
          params: [
            {
              script: {
                code_hash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
                hash_type: 'type',
                args: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              },
              script_type: 'lock',
            },
            'asc',
            '0x64',
          ],
        },
      ]),
    })

    expect(res.status).toEqual(200)

    const rpcResponses = await res.json()

    expect(rpcResponses.length).toEqual(2)

    expect(rpcResponses[0].result.objects.length).toEqual(1)
    expect(rpcResponses[0].result.objects.length).toEqual(1)
    expect(rpcResponses[0].result.objects[0].output.capacity).toEqual('0x1bc16d674ec80000')

    expect(rpcResponses[1].result.objects.length).toEqual(1)
    expect(rpcResponses[1].result.objects.length).toEqual(1)
    expect(rpcResponses[1].result.objects[0].output.capacity).toEqual('0x1bc16d674ec80000')
  })

  test('Unsupported network', async () => {
    expect(() => {
      execSync('npx kuai node --network test')
    }).toThrow(/The specified network is not defined, please configure it first/)
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
