import { config } from '@ckb-lumos/lumos'

export default interface Node<SA, SO, D> {
  url: string
  port: string
  host: string
  lumosConfig: config.Config
  start(params: SA): void
  stop(params: SO): void
  deployScripts(params: D): void
  generateLumosConfig(): void
}
