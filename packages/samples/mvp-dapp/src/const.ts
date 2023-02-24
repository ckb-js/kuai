import { bytes } from '@ckb-lumos/codec'

export const DAPP_DATA_PREFIX = bytes.hexify(Buffer.from('mvp-dapp'))

export const DAPP_DATA_PREFIX_LEN = DAPP_DATA_PREFIX.length

export const INITIAL_RECORD_STATE = Buffer.from('{}').toString('hex')

export const TX_FEE = 100000
