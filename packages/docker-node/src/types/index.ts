import type { CellDep, Indexer, RPC } from '@ckb-lumos/lumos'

export interface DockerNodeStartOptions {
  port: string
  detached?: boolean
  genesisAccountArgs?: string[]
}

export interface DockerNodeDeployOptions {
  builtInScriptName: string[]
  configFilePath: string
  builtInDirPath: string
  indexer: Indexer
  rpc: RPC
  privateKey: string
}

export type InfraScript = {
  name: string
  path: string
  cellDeps?: { name: string; cellDep: CellDep }[]
} & CellDep
