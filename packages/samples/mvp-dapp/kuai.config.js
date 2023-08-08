/**
 * @module kuai.config
 * @description
 * Kuai configuration file
 */

require('dotenv').config()

let redisOpt = undefined
if (process.env.REDIS_OPT) {
  try {
    redisOpt = JSON.parse(process.env.REDIS_OPT)
  } catch (error) {
    //ignore error, if error redisOpt will be undefined
  }
}

// fallback to REDISUSER due to https://github.com/ckb-js/kuai/pull/423#issuecomment-1668983983
const REDIS_USER = redisOpt?.username ?? process.env.REDUSUSER
const REDIS_PASSWORD = redisOpt?.password ?? process.env.REDISPASSWORD
const REDIS_HOST = process.env.REDIS_HOST ?? process.env.REDISHOST
const REDIS_PORT = process.env.REDIS_PORT ?? process.env.REDISPORT

const redisAuth = REDIS_USER && REDIS_PASSWORD ? { username: REDIS_USER, password: REDIS_PASSWORD } : undefined

module.exports = {
  host: process.env.HOST,
  port: process.env.PORT,
  network: 'testnet',
  redisPort: REDIS_PORT,
  redisHost: REDIS_HOST,
  redisOpt:
    redisOpt || redisAuth
      ? {
          ...redisOpt,
          ...redisAuth,
        }
      : undefined,
  jest: {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testPathIgnorePatterns: ['/__fixtures__/', '/__utils__/'],
    globals: {
      'ts-jest': {
        diagnostics: false,
      },
    },
  },
}
