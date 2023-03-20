require('dotenv').config()

module.exports = {
  host: process.env.HOST,
  port: process.env.PORT,
  rpcUrl: process.env.CKB_RPC_URL || 'https://testnet.ckb.dev/rpc',
  lumosConfig: process.env.LUMOS_CONFIG || 'aggron4',
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
