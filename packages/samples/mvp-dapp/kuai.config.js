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
  contract: {
    deployment: {
      type: 'ckb-cli',
      // just for example, please use env variables to pass the private key
      deployerPrivateKey: '0xd6013cd867d286ef84cc300ac6546013837df2b06c9f53c83b4c33c2417f6a07',
    },
  },
}
