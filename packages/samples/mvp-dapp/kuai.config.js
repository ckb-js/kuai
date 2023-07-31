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

module.exports = {
  host: process.env.HOST,
  port: process.env.PORT,
  network: 'testnet',
  redisPort: process.env.REDIS_PORT,
  redisHost: process.env.REDIS_HOST,
  redisOpt,
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
