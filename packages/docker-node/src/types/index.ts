import { ContractManager } from '@ckb-js/kuai-common'
import type { Indexer, RPC } from '@ckb-lumos/lumos'

export interface StartOptions {
  genesisAccountArgs?: string[]
  port: string
  detached?: boolean
}

export interface DeployOptions {
  builtInScriptName: string[]
  contractManager: ContractManager
  configFilePath: string
  builtInDirPath: string
  indexer: Indexer
  rpc: RPC
  privateKey: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StopOptions {}

export interface BinNodeStartOptions extends StartOptions {
  version: string
}

export interface BinNodeStopOptions extends StopOptions {
  version: string
  clear: boolean
}
