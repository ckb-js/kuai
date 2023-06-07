import { KuaiConfig } from '@ckb-js/kuai-core';

const config: KuaiConfig = {
  port: 3000,
  ckbChain: {
    rpcUrl: 'http://127.0.0.1:8114',
    prefix: 'ckt',
  },
};

export default config;
