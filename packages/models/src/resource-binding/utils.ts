import type { OutPointString } from '../store'
import type { Header, OutPoint } from '@ckb-lumos/base'
import { Manager } from './manager'
import { ActorReference } from '../actor'
import { ProviderKey } from '../utils'
import type { ChainSource } from '@ckb-js/kuai-io/lib/types'
import { NervosChainSource, type Listener, TipHeaderListener } from '@ckb-js/kuai-io'
import assert from 'node:assert'

export function outPointToOutPointString(outpoint: OutPoint): OutPointString {
  return `${outpoint.txHash}-${outpoint.index}`
}

export function initiateResourceBindingManager(params: {
  dataSource?: ChainSource
  listener?: Listener<Header>
  rpc?: string
}) {
  assert(params.rpc || params.dataSource, 'dataSource or rpc is required')

  const dataSource = params.dataSource ?? new NervosChainSource(params.rpc!)
  const listener = params.listener ?? new TipHeaderListener(dataSource)
  Reflect.defineMetadata(ProviderKey.Actor, { ref: new ActorReference('resource', '/').json }, Manager)
  const manager = new Manager(listener, dataSource)
  return { manager, ...manager.listen() }
}
