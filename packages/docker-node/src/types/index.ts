import type { CellDep, Indexer, RPC } from '@ckb-lumos/lumos'

export interface StartOptions {
  genesisAccountArgs?: string[]
  port: string
  detached?: boolean
}

export interface DeployOptions {
  builtInScriptName: string[]
  configFilePath: string
  builtInDirPath: string
  indexer: Indexer
  rpc: RPC
  privateKey: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StopOptions {}

export interface BinNodeStartOptions extends StartOptions {
  ckbPath: string
}

export interface BinNodeStopOptions extends StopOptions {
  ckbPath: string
  clear: boolean
}

export type InfraScript = {
  name: string
  path: string
  cellDeps?: { name: string; cellDep: CellDep }[]
} & CellDep
