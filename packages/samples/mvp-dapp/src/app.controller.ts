import { KuaiRouter } from '@ckb-js/kuai-io'
import { HexString, Script, helpers } from '@ckb-lumos/lumos'
import { ActorReference, Manager, ProviderKey, UpdateStorageValue } from '@ckb-js/kuai-models'
import { BadRequest } from 'http-errors'
import { appRegistry } from './actors'
import { OmnilockModel } from './omnilock/omnilock.model'
import { computeScriptHash } from '@ckb-lumos/base/lib/utils'
import { RecordModel, StoreType } from './record/record.model'
import { DAPP_DATA_PREFIX } from './const'
import { Tx } from './views/tx.view'

const router = new KuaiRouter()
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

const getLock = (address: string) => {
  try {
    return helpers.parseAddress(address)
  } catch {
    throw new BadRequest('invalid address')
  }
}

async function getOmnilockModel(address = ''): Promise<OmnilockModel> {
  const lock = getLock(address)
  const lockHash = computeScriptHash(lock)
  const actorRef = new ActorReference('omnilock', `/${lockHash}/`)
  let omnilockModel = appRegistry.find<OmnilockModel>(actorRef.uri)
  if (!omnilockModel) {
    class NewStore extends OmnilockModel {}
    Reflect.defineMetadata(ProviderKey.Actor, { ref: actorRef }, NewStore)
    Reflect.defineMetadata(ProviderKey.CellPattern, createCellPattern(lock), NewStore)
    Reflect.defineMetadata(ProviderKey.LockPattern, lock, NewStore)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appRegistry.bind(NewStore as any)
    omnilockModel = appRegistry.find<OmnilockModel>(actorRef.uri)
    if (!omnilockModel) throw new Error('ominilock bind error')
    await Manager.call('local://resource', new ActorReference('register'), {
      pattern: lockHash,
      value: { type: 'register', register: { lockScript: lock, uri: actorRef.uri, pattern: lockHash } },
    })
  }
  return omnilockModel
}

async function getRecordModel(address: string): Promise<RecordModel> {
  const lock = getLock(address)
  const lockHash = computeScriptHash(lock)
  const actorRef = new ActorReference('record', `/${lockHash}/`)
  let recordModel = appRegistry.find<RecordModel>(actorRef.uri)
  if (!recordModel) {
    class NewStore extends RecordModel {}
    Reflect.defineMetadata(ProviderKey.Actor, { ref: actorRef }, NewStore)
    Reflect.defineMetadata(ProviderKey.CellPattern, createRecordPattern(lock), NewStore)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appRegistry.bind(NewStore as any)
    recordModel = appRegistry.find<RecordModel>(actorRef.uri)
    if (!recordModel) throw new Error('record bind error')
    await Manager.call('local://resource', new ActorReference('register'), {
      pattern: lockHash,
      value: { type: 'register', register: { lockScript: lock, uri: actorRef.uri, pattern: lockHash } },
    })
    return recordModel
  }
  return recordModel
}

router.get<never, { address: string }>('/meta/:address', async (ctx) => {
  const omniLockModel = await getOmnilockModel(ctx.payload.params?.address)
  ctx.ok(omniLockModel.meta)
})

router.post<never, { address: string }, { capacity: HexString }>('/claim/:address', async (ctx) => {
  const { body, params } = ctx.payload

  if (!body?.capacity) {
    throw new BadRequest('undefined body field: capacity')
  }

  const omnilockModel = await getOmnilockModel(params?.address)
  const result = omnilockModel.claim(body.capacity)
  ctx.ok(Tx.toJsonString(result))
})

router.get<never, { path: string; address: string }>('/load/:address/:path', async (ctx) => {
  const { params } = ctx.payload

  if (!params?.path) {
    throw new BadRequest('invalid path')
  }

  const recordModel = await getRecordModel(params?.address)
  const value = recordModel.load(`data.${params.path}`)
  if (value) {
    ctx.ok(value)
  } else {
    ctx.err('field is not found')
  }
})

router.get<never, { address: string }>('/load/:address', async (ctx) => {
  const recordModel = await getRecordModel(ctx.payload.params?.address)
  const key = recordModel.getOneOfKey()
  if (!key) {
    ctx.err('store is not found')
    return
  }
  ctx.ok(recordModel.load('data'))
})

router.post<never, { address: string }, { value: StoreType['data'] }>('/set/:address', async (ctx) => {
  const recordModel = await getRecordModel(ctx.payload.params?.address)
  const result = recordModel.update(ctx.payload.body.value)
  ctx.ok(Tx.toJsonString(result))
})

router.post<never, { address: string }>('/clear/:address', async (ctx) => {
  const recordModel = await getRecordModel(ctx.payload.params?.address)
  const result = recordModel.clear()
  ctx.ok(await Tx.toJsonString(result))
})

export { router }
