import type { ContractDeploymentInfo, ContractLoader } from './interface'
import fs from 'node:fs'

export class KuaiContractLoader implements ContractLoader {
  constructor(private path: string) {}

  load = (): ContractDeploymentInfo[] =>
    fs.existsSync(this.path) ? JSON.parse(fs.readFileSync(this.path, 'utf-8')) ?? [] : []

  write = (info: ContractDeploymentInfo[]) => fs.writeFileSync(this.path, Buffer.from(JSON.stringify(info)))
}
