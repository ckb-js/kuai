import type { OutPointString } from '../store'
import type { Header, OutPoint } from '@ckb-lumos/base'
import { Manager } from './manager'
import { ActorReference } from '../actor'
import { ProviderKey } from '../utils'
import type { ChainSource } from '@ckb-js/kuai-io/lib/types'
import type { Listener } from '@ckb-js/kuai-io'

export function outPointToOutPointString(outpoint: OutPoint): OutPointString {
  return `${outpoint.txHash}-${outpoint.index}`
}

export function initiateResourceBindingManager(dataSource: ChainSource, listener: Listener<Header>) {
  Reflect.defineMetadata(ProviderKey.Actor, { ref: new ActorReference('resource', '/').json }, Manager)
  const manager = new Manager(listener, dataSource)
  return { manager, ...manager.listen() }
}
