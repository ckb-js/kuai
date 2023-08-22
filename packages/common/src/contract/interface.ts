import type { CellDep, Script } from '@ckb-lumos/lumos'

export type ContractDeploymentInfo = {
  name: string
  path: string
  cellDeps?: ({ name: string } | { cellDep: CellDep })[]
  scriptBase: Omit<Script, 'args'>
} & CellDep

export interface ContractLoader {
  load: () => ContractDeploymentInfo[]
  write: (info: ContractDeploymentInfo[]) => void
}
