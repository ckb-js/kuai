import type { ContractDeploymentInfo, ContractLoader } from './interface'
import fs from 'node:fs'
import { validateCellDeps, validateName, validatePath, validateScriptBase, validateCellDep } from './validator'

export class KuaiContractLoader implements ContractLoader {
  constructor(private path: string) {}

  load = (): ContractDeploymentInfo[] =>
    fs.existsSync(this.path) ? JSON.parse(fs.readFileSync(this.path, 'utf-8')) ?? [] : []

  write = (info: ContractDeploymentInfo[]) => {
    if (!Array.isArray(info)) {
      throw new Error(`info must be an array`)
    }
    for (const item of info) {
      validateCellDeps(item)
      validatePath(item)
      validateName(item)
      validateScriptBase(item)
      validateCellDep(item)
    }

    fs.writeFileSync(this.path, Buffer.from(JSON.stringify(info)))
  }
}
