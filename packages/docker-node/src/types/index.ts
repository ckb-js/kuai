import type { CellDep } from '@ckb-lumos/lumos'

export interface DockerNodeStartOptions {
  port: string
  detached?: boolean
  genesisAccountArgs?: string[]
}

export interface InfraScript {
  name: string
  path: string
  cellDep: { cellDeps?: CellDep[] } & CellDep
}
