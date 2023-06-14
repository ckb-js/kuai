/**
 * @module src/const
 * @description
 * This module defines the constants used in the application.
 */

import { JSONStorage } from '@ckb-js/kuai-models'
import type { Script, CellDep } from '@ckb-lumos/base'
import { bytes } from '@ckb-lumos/codec'

export const DAPP_DATA_PREFIX = bytes.hexify(Buffer.from('mvp-dapp'))

export const DAPP_DATA_PREFIX_LEN = DAPP_DATA_PREFIX.length

export const INITIAL_RECORD_STATE = bytes
  .hexify(new JSONStorage().serialize({ addresses: [{ key: 'ckb', value: '123' }] }))
  .slice(2)

export const TX_FEE = 100000

export const MVP_CONTRACT_TYPE_SCRIPT: Script = {
  codeHash: '0x1a3de2a61b454e8492a775cf438748e362e71930170bec90c4e6b79e4dd7ea3c',
  hashType: 'type',
  args: '0x',
}

export const MVP_CONTRACT_CELL_DEP: CellDep = {
  outPoint: {
    txHash: '0x005a153ec6a35adbc8d82544ae11d8c6f8c0601fc9059f8a872e01f638fc9f62',
    index: '0x0',
  },
  depType: 'code',
}
