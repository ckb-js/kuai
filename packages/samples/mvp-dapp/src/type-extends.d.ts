/**
 * @module src/type-extends
 * @description
 * This module defines the type extends for the application.
 */

import '@ckb-js/kuai-core'
import type { Config } from '@ckb-lumos/config-manager'

declare module '@ckb-js/kuai-core' {
  export interface KuaiConfig {
    port?: number
    host?: string
    rpcUrl: string
    lumosConfig?: Config | 'aggron4' | 'lina'
    redisPort?: number
    redisHost?: string
  }
}
