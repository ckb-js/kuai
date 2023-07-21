import '@ckb-js/kuai-core';
import { Config } from '@ckb-lumos/config-manager';

declare module '@ckb-js/kuai-core' {
  export interface KuaiConfig {
    port?: number;
    lumosConfig?: Config | 'aggron4' | 'lina';
    redisPort?: number;
    redisHost?: string;
  }
}
