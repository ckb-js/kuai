import type { ActorRef } from '../../actor'
import { ActorReference } from '../../actor'
import { UpdateStorageValue } from '../../store'
import { ActorProviderException } from '../exception'

export const ProviderKey = {
  Actor: Symbol('container:actor'),
  ActorParam: Symbol('container:actor:param'),
  SchemaPattern: Symbol('store:schema:pattern'),
  CellPattern: Symbol('store:cell:pattern'),
  LockPattern: Symbol('store:lock:pattern'),
  TypePattern: Symbol('store:type:pattern'),
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

export interface ActorParamType {
  routerParam: string
  parameterIndex: number
}

export const Param = (routerParam: string): ParameterDecorator => {
  return (target: object, propertyKey: string | symbol, parameterIndex: number): void => {
    const params: ActorParamType[] = Reflect.getMetadata(ProviderKey.ActorParam, target) ?? []

    params.push({ routerParam, parameterIndex })
    params.sort((a, b) => a.parameterIndex - b.parameterIndex)
    Reflect.defineMetadata(ProviderKey.ActorParam, params, target)
  }
}

export type MatchFunc<T> = (value: T) => boolean

export type SchemaPattern = MatchFunc<unknown>

export type CellPattern = MatchFunc<UpdateStorageValue>

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
