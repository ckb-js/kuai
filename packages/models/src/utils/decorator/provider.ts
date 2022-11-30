import type { ActorRef } from '../../actor'
import { ActorReference } from '../../actor'
import { ActorProviderException } from '../exception'

export const ProviderKey = {
  Actor: Symbol('container:actor'),
}

export const ActorProvider = (actorRef: Partial<Pick<ActorRef, 'name' | 'path'>> = {}) => {
  return (target: unknown): void => {
    if (!target || typeof target !== 'function') {
      throw new ActorProviderException()
    }

    Reflect.defineMetadata(
      ProviderKey.Actor,
      {
        ref: new ActorReference(actorRef.name || Date.now().toString(), actorRef.path || '/').json, // TODO: use uuid in actor name
      },
      target,
    )
  }
}
