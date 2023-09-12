import type { ContractDeploymentInfo, ContractLoader } from './interface'

export class ContractManager {
  #contracts: Map<string, [info: ContractDeploymentInfo, loader: ContractLoader]>

  constructor(private loaders: ContractLoader[]) {
    this.#contracts = new Map()

    this.loaders.forEach((loader) => {
      loader.load().forEach((contract) => {
        this.#contracts.set(contract.name, [contract, loader])
      })
    })
  }

  updateContract = (info: ContractDeploymentInfo, loader?: ContractLoader) =>
    this.#contracts.set(info.name, [info, loader ?? this.#contracts.get(info.name)?.[1] ?? this.loaders[0]])

  write = () => {
    this.#contracts.forEach(([info, loader]) => {
      loader.write([info])
    })
  }

  getContract = (name: string): ContractDeploymentInfo | undefined => {
    const contract = this.#contracts.get(name)

    return contract?.[0]
  }

  get contracts(): ContractDeploymentInfo[] {
    return [...this.#contracts.values()].map(([info]) => info)
  }
}
