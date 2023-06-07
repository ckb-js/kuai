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
  codeHash: '0x2e84615cbe410d71210472aff6489d55267769213e03b3d613d6c9b3d9df773f',
  hashType: 'type',
  args: '0x',
}

export const MVP_CONTRACT_CELL_DEP: CellDep = {
  outPoint: {
    txHash: '0xf0c0b63a07940359d605b04f26a96b509a31dacc4d548293f69091ef2e4a6b18',
    index: '0x0',
  },
  depType: 'code',
}
