import type { Middleware, RouterContext } from '@ckb-js/kuai-io/lib/types'
import { computeScriptHash } from '@ckb-lumos/base/lib/utils'
import { helpers } from '@ckb-lumos/lumos'
import { BadRequest } from 'http-errors'
import { ActorName, ActorReference } from '../actor'
import { ProviderKey } from '../utils'

export function resourceBindingRegisterMiddleware(
  actorName: ActorName,
  module: new (...args: Array<unknown>) => unknown,
): Middleware<RouterContext> {
  return async (ctx) => {
    const address = ctx.payload?.params?.address
    if (!address) return

    try {
      const lock = helpers.parseAddress(address)

      const lockHash = computeScriptHash(lock)
      const actorRef = new ActorReference(actorName, `/${lockHash}/`)
      Reflect.defineMetadata(
        ProviderKey.ResourceBindingRegister,
        {
          pattern: lockHash,
          value: { type: 'register', register: { lockScript: lock, uri: actorRef.uri, pattern: lockHash } },
        },
        module,
        actorRef.uri,
      )
    } catch {
      throw new BadRequest('invalid address')
    }
  }
}
