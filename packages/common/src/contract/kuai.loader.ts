import type { ContractDeploymentInfo, ContractLoader } from './interface'
import fs from 'node:fs'
import { validateName, validatePath, validateScriptBase, validatecellDep } from './validator'

export class KuaiContractLoader implements ContractLoader {
  constructor(private path: string) {}

  load = (): ContractDeploymentInfo[] =>
    fs.existsSync(this.path) ? JSON.parse(fs.readFileSync(this.path, 'utf-8')) ?? [] : []

  write = (info: ContractDeploymentInfo[]) => {
    if (!Array.isArray(info)) {
      throw new Error(`info must be an array`)
    }
    for (const key in info) {
      validatecellDep(validatePath(validateName(validateScriptBase(validatecellDep(info[key])))))
    }

    fs.writeFileSync(this.path, Buffer.from(JSON.stringify(info)))
  }
}
