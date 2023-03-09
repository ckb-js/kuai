import type { Middleware, RouterContext } from '@ckb-js/kuai-io/lib/types'
import { ActorReference, ProviderKey, UpdateStorageValue } from '@ckb-js/kuai-models'
import { computeScriptHash } from '@ckb-lumos/base/lib/utils'
import { Script, helpers } from '@ckb-lumos/lumos'
import { BadRequest } from 'http-errors'
import { DAPP_DATA_PREFIX } from './const'
import { OmnilockModel, RecordModel } from './actors'

function createCellPattern(lock: Script) {
  return (value: UpdateStorageValue) => {
    const cellLock = value.cell.cellOutput.lock
    return (
      cellLock.args === lock?.args &&
      cellLock.codeHash === lock?.codeHash &&
      cellLock.hashType === lock?.hashType &&
      value.cell.data === '0x'
    )
  }
}

function createRecordPattern(lock: Script) {
  return (value: UpdateStorageValue) => {
    const cellLock = value.cell.cellOutput.lock
    return (
      cellLock.args === lock?.args &&
      cellLock.codeHash === lock?.codeHash &&
      cellLock.hashType === lock?.hashType &&
      value.cell.data.startsWith(DAPP_DATA_PREFIX)
    )
  }
}

export function cellPatternMiddleware(): Middleware<RouterContext> {
  return async (ctx) => {
    const address = ctx.payload?.params?.address
    if (!address) return

    try {
      const lock = helpers.parseAddress(address)

      const lockHash = computeScriptHash(lock)
      const actorRef = new ActorReference('omnilock', `/${lockHash}/`)
      Reflect.defineMetadata(ProviderKey.CellPattern, createCellPattern(lock), OmnilockModel, actorRef.uri)
    } catch {
      throw new BadRequest('invalid address')
    }
  }
}

export function recordPatternMiddleware(): Middleware<RouterContext> {
  return async (ctx) => {
    const address = ctx.payload?.params?.address
    if (!address) return

    try {
      const lock = helpers.parseAddress(address)

      const lockHash = computeScriptHash(lock)
      const actorRef = new ActorReference('record', `/${lockHash}/`)
      Reflect.defineMetadata(ProviderKey.CellPattern, createRecordPattern(lock), RecordModel, actorRef.uri)
    } catch {
      throw new BadRequest('invalid address')
    }
  }
}
