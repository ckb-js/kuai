/**
 * @module kuai.config
 * @description
 * Kuai configuration file
 */

require('dotenv').config()

module.exports = {
  host: process.env.HOST,
  port: process.env.PORT,
  network: 'testnet',
  redisPort: process.env.REDIS_PORT,
  redisHost: process.env.REDIS_HOST,
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
