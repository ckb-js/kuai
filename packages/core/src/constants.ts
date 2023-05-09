import { NetworkConfig } from './type'
import { config } from '@ckb-lumos/lumos'
import { KuaiArguments } from './type'
import envPaths from 'env-paths'

export const DEFAULT_KUAI_ARGUMENTS = {
  network: 'docker-node',
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
