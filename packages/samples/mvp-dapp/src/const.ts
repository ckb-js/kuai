import { bytes } from '@ckb-lumos/codec'

export const DAPP_DATA_PREFIX = bytes.hexify(Buffer.from('mvp-dapp'))

export const DAPP_DATA_PREFIX_LEN = DAPP_DATA_PREFIX.length
