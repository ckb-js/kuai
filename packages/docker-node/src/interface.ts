import { config } from '@ckb-lumos/lumos'

export interface CKBNode {
  url: string
  port: string
  host: string
  lumosConfig: config.Config
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  start(params: any): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stop(params: any): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deployScripts(params: any): void
  generateLumosConfig(): void
}
