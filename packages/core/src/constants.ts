import { NetworkConfig } from './type'
import { config } from '@ckb-lumos/lumos'
import envPaths from 'env-paths'

export const DEFAULT_KUAI_PRIVATE_KEY = '0xfd686a48908e8caf97723578bf85f746e1e1d8956cb132f6a2e92e7234a2a245'

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
