import type { ActorRef } from '../../actor'
import { ActorReference } from '../../actor'
import { UpdateStorageValue } from '../../store'
import { ActorProviderException } from '../exception'

export const ProviderKey = {
  Actor: Symbol('container:actor'),
  SchemaPattern: Symbol('store:schema:pattern'),
  CellPattern: Symbol('store:cell:pattern'),
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

type SchemaMatch = (value: unknown, preMatch: boolean) => boolean
export type SchemaPattern = SchemaMatch | SchemaMatch[]

type CellMatch = (value: UpdateStorageValue, preMatch: boolean) => boolean
export type CellPattern = CellMatch | CellMatch[]

export function Pattern({
  cellPattern,
  schemaPattern,
}: {
  cellPattern?: CellPattern
  schemaPattern?: SchemaPattern
}): ClassDecorator {
  return function (target) {
    if (cellPattern) {
      Reflect.defineMetadata(ProviderKey.CellPattern, cellPattern, target)
    }
    if (schemaPattern) {
      Reflect.defineMetadata(ProviderKey.SchemaPattern, schemaPattern, target)
    }
  }
}
