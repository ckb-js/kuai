import { NetworkConfig } from './type'
import { config } from '@ckb-lumos/lumos'
import envPaths from 'env-paths'

export const DEFAULT_KUAI_PRIVATE_KEY = '0xfd686a48908e8caf97723578bf85f746e1e1d8956cb132f6a2e92e7234a2a245'

export const CKB_CLI_RELEASE_URL = 'https://github.com/nervosnetwork/ckb-cli/releases/download'
export const DEFAULT_CKB_CLI_VERSION = '1.4.0'
export const DEFAULT_BIN_PATH = '.bin'

export const DEFAULT_DEVNET_ACCOUNT_PKS = [
  '0xfd686a48908e8caf97723578bf85f746e1e1d8956cb132f6a2e92e7234a2a245',
  '0x5368b818f59570b5bc078a6a564f098a191dcb8938d95c413be5065fd6c42d32',
  '0xd6013cd867d286ef84cc300ac6546013837df2b06c9f53c83b4c33c2417f6a07',
  '0x13b08bb054d5dd04013156dced8ba2ce4d8cc5973e10d905a228ea1abc267e60',
]

export const DEFAULT_KUAI_ARGUMENTS = {
  network: 'docker-node',
  privateKey: DEFAULT_KUAI_PRIVATE_KEY,
}

export const DEFAULT_NETWORKDS: {
  [name: string]: NetworkConfig
} = {
  mainnet: {
    rpcUrl: 'https://mainnet.ckb.dev/rpc',
    prefix: 'ckb',
    scripts: config.predefined.LINA.SCRIPTS,
  },
  testnet: {
    rpcUrl: 'https://testnet.ckb.dev/rpc',
    prefix: 'ckt',
    scripts: config.predefined.AGGRON4.SCRIPTS,
  },
  devnet: {
    rpcUrl: 'http://127.0.0.1:8114',
    prefix: 'ckt',
  },
  'docker-node': {
    rpcUrl: 'http://127.0.0.1:8114',
    prefix: 'ckt',
  },
}
export const PATH = envPaths('kuai')
