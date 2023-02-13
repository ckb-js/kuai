import '@ckb-js/kuai-core'

declare module '@ckb-js/kuai-core' {
  export interface KuaiConfig {
    port?: number
    rpcUrl: string
    indexerUrl: string
  }
}
