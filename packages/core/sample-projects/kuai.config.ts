import { KuaiConfig } from '@ckb-js/kuai-core';

let redisOpt = undefined;
if (process.env.REDIS_OPT) {
  try {
    redisOpt = JSON.parse(process.env.REDIS_OPT);
  } catch (error) {
    //ignore error, if error redisOpt will be undefined
  }
}

const config: KuaiConfig = {
  port: 3000,
  redisPort: process.env.REDIS_PORT ? +process.env.REDIS_PORT : undefined,
  redisHost: process.env.REDIS_HOST,
  redisOpt,
  ckbChain: {
    rpcUrl: 'http://127.0.0.1:8114',
    prefix: 'ckt',
  },
};

export default config;
