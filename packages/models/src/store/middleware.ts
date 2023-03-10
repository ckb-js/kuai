import type { Middleware, RouterContext } from '@ckb-js/kuai-io/lib/types'
import { computeScriptHash } from '@ckb-lumos/base/lib/utils'
import { helpers } from '@ckb-lumos/lumos'
import { BadRequest } from 'http-errors'
import { ActorName, ActorRef, ActorReference } from '../actor'
import { ProviderKey } from '../utils'

export function lockMiddleware(
  actorName: ActorName,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  module: new (ref?: ActorRef | undefined, ...args: Array<any>) => unknown,
): Middleware<RouterContext> {
  return async (ctx) => {
    const address = ctx.payload?.params?.address
    if (!address) return

    try {
      const lock = helpers.parseAddress(address)

      const lockHash = computeScriptHash(lock)
      const actorRef = new ActorReference(actorName, `/${lockHash}/`)
      Reflect.defineMetadata(ProviderKey.LockPattern, lock, module, actorRef.uri)
    } catch {
      throw new BadRequest('invalid address')
    }
  }
}
