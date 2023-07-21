/**
 * @module src/const
 * @description
 * This module defines the constants used in the application.
 */

import type { Script, CellDep } from '@ckb-lumos/base'
import { bytes } from '@ckb-lumos/codec'
import { getDeployedContracts } from './utils'
import { MvpError } from './exception'

export const DAPP_DATA_PREFIX = bytes.hexify(Buffer.from('mvp-dapp'))

export const DAPP_DATA_PREFIX_LEN = DAPP_DATA_PREFIX.length

export const TX_FEE = 100000

// runtime constants
const deployedContracts = getDeployedContracts()
const mvpContract = deployedContracts['kuai-mvp-contract']

if (!mvpContract) {
  throw new MvpError('MVP contract is not found', '404')
}

export const MVP_CONTRACT_TYPE_SCRIPT: Script = mvpContract.script

export const MVP_CONTRACT_CELL_DEP: CellDep = {
  outPoint: mvpContract.outPoint,
  depType: mvpContract.depType,
}
