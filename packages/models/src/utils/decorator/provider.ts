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

export const ActorProvider = (actorRef: Partial<Pick<ActorRef, 'name' | 'path'>> = {}, bindWhenBootstrap = false) => {
  return (target: unknown): void => {
    if (!target || typeof target !== 'function') {
      throw new ActorProviderException()
    }

    Reflect.defineMetadata(
      ProviderKey.Actor,
      {
        ref: new ActorReference(actorRef.name || Date.now().toString(), actorRef.path || '/'), // TODO: use uuid in actor name
        bindWhenBootstrap,
      },
      target,
    )
  }
}

export interface ActorParamType {
  routerParam: string
  parameterIndex: number
}

export const Param = (routerParam: string) => {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number): void => {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cellPattern?: (...args: Array<any>) => CellPattern
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

export function DataCellPattern(data: string): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cellPattern = (obj: any) => {
    return (value: UpdateStorageValue) => {
      const cellLock = value.cell.cellOutput.lock
      return (
        cellLock.args === obj.lockScript?.args &&
        cellLock.codeHash === obj.lockScript?.codeHash &&
        cellLock.hashType === obj.lockScript?.hashType &&
        value.cell.data === data
      )
    }
  }

  return Pattern({ cellPattern })
}

export function DataPrefixCellPattern(prefix: string): ClassDecorator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cellPattern = (obj: any) => {
    return (value: UpdateStorageValue) => {
      const cellLock = value.cell.cellOutput.lock
      return (
        cellLock.args === obj.lockScript?.args &&
        cellLock.codeHash === obj.lockScript?.codeHash &&
        cellLock.hashType === obj.lockScript?.hashType &&
        value.cell.data.startsWith(prefix)
      )
    }
  }

  return Pattern({ cellPattern })
}
