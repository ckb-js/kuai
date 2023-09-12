import { ContractDeploymentInfo } from './interface'

export const validateCellDeps = (info: ContractDeploymentInfo) => {
  if (info.cellDeps) {
    if (!Array.isArray(info.cellDeps)) {
      throw new Error(`cellDeps must be an array`)
    }

    if (
      !info.cellDeps.every((cellDep) => {
        return (
          'name' in cellDep ||
          ('cellDep' in cellDep &&
            'outPoint' in cellDep.cellDep &&
            'txHash' in cellDep.cellDep.outPoint &&
            'index' in cellDep.cellDep.outPoint &&
            ['code', 'depGroup'].includes(cellDep.cellDep.depType))
        )
      })
    ) {
      throw new Error(`cellDeps must be an array of { name: string } or { cellDep: CellDep }`)
    }
  }

  return info
}

export const validateScriptBase = (info: ContractDeploymentInfo) => {
  if (!info.scriptBase) {
    throw new Error(`scriptBase is required`)
  }

  if (!('codeHash' in info.scriptBase)) {
    throw new Error(`codeHash is required`)
  }

  if (!('hashType' in info.scriptBase)) {
    throw new Error(`hashType is required`)
  }

  return info
}

export const validateName = (info: ContractDeploymentInfo) => {
  if (!info.name) {
    throw new Error(`name is required`)
  }

  return info
}

export const validatePath = (info: ContractDeploymentInfo) => {
  if (!info.path) {
    throw new Error(`path is required`)
  }

  return info
}

export const validateCellDep = (info: ContractDeploymentInfo) => {
  if (!('outPoint' in info)) {
    throw new Error(`outPoint is required`)
  }

  if (!('txHash' in info.outPoint)) {
    throw new Error(`txHash is required`)
  }

  if (!('index' in info.outPoint)) {
    throw new Error(`index is required`)
  }

  if (!info.depType || !['code', 'depGroup'].includes(info.depType)) {
    throw new Error(`depType must be code or depGroup`)
  }

  return info
}
