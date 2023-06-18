import { join } from 'node:path'
import { existsSync, readFileSync } from 'node:fs'
import { MvpError } from '../exception'

/**
 * This method is used to get deployed transactions of the contract module,
 * and will be obsolete once these information are injected by kuai framework
 */
export const getDeployedContracts = () => {
  const PATH = join('contract', 'deployed', 'contracts.json')
  if (!existsSync(PATH)) {
    throw new MvpError(`${PATH}, please deploy contracts first`, '500')
  }

  try {
    const data = readFileSync(PATH, 'utf8')
    const deployed = JSON.parse(data)
    return deployed
  } catch {
    throw new MvpError(`Failed to load ${PATH}, please check the file format`, '500')
  }
}
