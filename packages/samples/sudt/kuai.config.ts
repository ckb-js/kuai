let redisOpt = undefined
if (process.env.REDIS_OPT) {
  try {
    redisOpt = JSON.parse(process.env.REDIS_OPT)
  } catch (error) {
    //ignore error, if error redisOpt will be undefined
  }
}

// fallback to REDISUSER due to https://github.com/ckb-js/kuai/pull/423#issuecomment-1668983983
const REDIS_USER = redisOpt?.username ?? process.env.REDISUSER
const REDIS_PASSWORD = redisOpt?.password ?? process.env.REDISPASSWORD
const REDIS_HOST = process.env.REDIS_HOST ?? process.env.REDISHOST
const REDIS_PORT = process.env.REDIS_PORT ?? process.env.REDISPORT

const redisAuth = REDIS_USER && REDIS_PASSWORD ? { username: REDIS_USER, password: REDIS_PASSWORD } : undefined

const config = {
  port: 3000,
  redisPort: REDIS_HOST ? +REDIS_HOST : undefined,
  redisHost: REDIS_PORT,
  network: process.env.NETWORK || 'testnet',
  redisOpt:
    redisOpt || redisAuth
      ? {
          ...redisOpt,
          ...redisAuth,
        }
      : undefined,
}

export default config
