import type { CellDep, Script } from '@ckb-lumos/lumos'
import { Path } from './path'

export type ContractDeploymentInfo = {
  name: string
  path: Path
  cellDeps?: ({ name: string } | { cellDep: CellDep })[]
  scriptBase: Omit<Script, 'args'>
} & CellDep

export interface ContractLoader {
  load: () => ContractDeploymentInfo[]
  write: (info: ContractDeploymentInfo[]) => void
}
