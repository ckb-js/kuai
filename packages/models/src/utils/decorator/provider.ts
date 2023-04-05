import { Script } from '@ckb-lumos/base'
import type { ActorRef } from '../../actor'
import { ActorReference } from '../../actor'
import { UpdateStorageValue } from '../../store'
import { ActorProviderException } from '../exception'
import { createScriptRegistry } from '@ckb-lumos/experiment-tx-assembler'
import { config } from '@ckb-lumos/lumos'

export const ProviderKey = {
  Actor: Symbol('container:actor'),
  ActorParam: Symbol('container:actor:param'),
  ActorRoute: Symbol('container:actor:route'),
  SchemaPattern: Symbol('store:schema:pattern'),
  CellPattern: Symbol('store:cell:pattern'),
  LockPattern: Symbol('store:lock:pattern'),
  TypePattern: Symbol('store:type:pattern'),
  LockParam: Symbol('store:lock:param'),
}

export const ActorProvider = (params: {
  ref: Partial<Pick<ActorRef, 'name' | 'path'>>
  autoBind?: boolean
}): ClassDecorator => {
  const { ref, autoBind } = params
  return (target: unknown): void => {
    if (!target || typeof target !== 'function') {
      throw new ActorProviderException()
    }

    Reflect.defineMetadata(
      ProviderKey.Actor,
      {
        ref: new ActorReference(ref.name || Date.now().toString(), ref.path || '/'), // TODO: use uuid in actor name
        autoBind,
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

export function Lock(script?: Partial<Script>): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(
      ProviderKey.LockPattern,
      (ref?: ActorRef) => {
        const codeHash = script?.codeHash ?? ref?.params?.codeHash
        const hashType = script?.hashType ?? ref?.params?.hashType
        const args = script?.args ?? ref?.params?.args ?? '0x'
        return codeHash && hashType ? { codeHash, hashType, args } : undefined
      },
      target,
    )
  }
}

export function Omnilock(): ClassDecorator {
  return (target: object) => {
    Reflect.defineMetadata(
      ProviderKey.LockPattern,
      (ref?: ActorRef) =>
        createScriptRegistry(config.getConfig().SCRIPTS).newScript('OMNILOCK', ref?.params?.args ?? '0x'),
      target,
    )
  }
}
