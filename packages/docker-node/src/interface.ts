import { config } from '@ckb-lumos/lumos'

export default interface Node<S, D> {
  url: string
  port: string
  host: string
  lumosConfig: config.Config
  start(params: S): void
  deployScripts(params: D): void
  generateLumosConfig(): void
}
