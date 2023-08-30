import '@ckb-js/kuai-core';
import type { Config } from '@ckb-lumos/config-manager';
import type { RedisOptions } from 'ioredis';

declare module '@ckb-js/kuai-core' {
  export interface KuaiConfig {
    port?: number;
    lumosConfig?: Config | 'aggron4' | 'lina';
    redisPort?: number;
    redisHost?: string;
    redisOpt?: RedisOptions;
  }
}
