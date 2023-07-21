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

export const Pattern =
  ({
    cellPattern,
    schemaPattern,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cellPattern?: (...args: any[]) => CellPattern
    schemaPattern?: SchemaPattern
  }): ClassDecorator =>
  (target) => {
    if (cellPattern) {
      const patterns = Reflect.getMetadata(ProviderKey.CellPattern, target) ?? []
      patterns.push(cellPattern)
      Reflect.defineMetadata(ProviderKey.CellPattern, patterns, target)
    }
    if (schemaPattern) {
      Reflect.defineMetadata(ProviderKey.SchemaPattern, schemaPattern, target)
    }
  }

export const LockPattern = (): ClassDecorator =>
  Pattern({
    cellPattern: (obj: { lockScript: Script }) => (value: UpdateStorageValue) =>
      value.cell.cellOutput.lock.args === obj.lockScript.args &&
      value.cell.cellOutput.lock.codeHash === obj.lockScript.codeHash &&
      value.cell.cellOutput.lock.hashType === obj.lockScript.hashType,
  })

// FIXME: refactor with LockPattern
export const TypePattern = (): ClassDecorator =>
  Pattern({
    cellPattern: (obj: { typeScript: Script }) => (value: UpdateStorageValue) =>
      value.cell.cellOutput.type?.args === obj.typeScript.args &&
      value.cell.cellOutput.type?.codeHash === obj.typeScript.codeHash &&
      value.cell.cellOutput.type?.hashType === obj.typeScript.hashType,
  })

export const DataPattern = (data: string): ClassDecorator =>
  Pattern({ cellPattern: () => (value: UpdateStorageValue) => value.cell.data == data })

export const DataPrefixPattern = (prefix: string): ClassDecorator =>
  Pattern({ cellPattern: () => (value: UpdateStorageValue) => value.cell.data.startsWith(prefix) })

export const Lock =
  (script?: Partial<Script>): ClassDecorator =>
  (target: object) =>
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

// FIXME: refactor with Lock
export const Type =
  (script?: Partial<Script>): ClassDecorator =>
  (target: object) =>
    Reflect.defineMetadata(
      ProviderKey.TypePattern,
      (ref?: ActorRef) => {
        const codeHash = script?.codeHash ?? ref?.params?.codeHash
        const hashType = script?.hashType ?? ref?.params?.hashType
        const args = script?.args ?? ref?.params?.args ?? '0x'
        return codeHash && hashType ? { codeHash, hashType, args } : undefined
      },
      target,
    )

export const DefaultLock =
  (lockName: keyof config.ScriptConfigs): ClassDecorator =>
  (target: object) =>
    Reflect.defineMetadata(
      ProviderKey.LockPattern,
      (ref?: ActorRef) =>
        createScriptRegistry(config.getConfig().SCRIPTS).newScript(lockName, ref?.params?.args ?? '0x'),
      target,
    )

export const Omnilock = (): ClassDecorator => DefaultLock('OMNILOCK')

export const Secp256k1Lock = (): ClassDecorator => DefaultLock('SECP256K1_BLAKE160')
