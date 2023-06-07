import type { CellDep } from '@ckb-lumos/lumos'

export interface DockerNodeStartOptions {
  port: string
  detached?: boolean
  genesisAccountArgs?: string[]
}

export type InfraScript = {
  name: string
  path: string
  cellDeps?: { name: string; cellDep: CellDep }[]
} & CellDep
