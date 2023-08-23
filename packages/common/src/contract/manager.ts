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

  updateContract = (info: ContractDeploymentInfo, loader?: ContractLoader) => {
    const contract = this.#contracts.get(info.name)
    if (contract) {
      const [_, loader] = contract
      this.#contracts.set(info.name, [info, loader])
    } else {
      this.#contracts.set(info.name, [info, loader ?? this.loaders[0]])
    }
  }

  write = () => {
    this.#contracts.forEach(([info, loader]) => {
      loader.write([info])
    })
  }

  getContract = (name: string): ContractDeploymentInfo | undefined => {
    const contract = this.#contracts.get(name)

    if (contract) {
      const [info] = contract
      return info
    }
  }

  get contracts(): ContractDeploymentInfo[] {
    return [...this.#contracts.values()].map(([info]) => info)
  }
}
