import { KuaiRouter } from '@ckb-js/kuai-io'
import { HashType, HexString, Script } from '@ckb-lumos/lumos'
import { ActorReference, Manager, ProviderKey, UpdateStorageValue } from '@ckb-js/kuai-models'
import { appRegistry } from './actors'
import { Load } from './views/load.view'
import { Read } from './views/read.view'
import { OmnilockModel } from './omnilock/omnilock.model'
import { computeScriptHash } from '@ckb-lumos/base/lib/utils'
import { RecordModel, StoreType } from './record/record.model'
import { DAPP_DATA_PREFIX } from './const'

const router = new KuaiRouter()
function createCellPattern(lock: Script) {
  return (value: UpdateStorageValue) => {
    const cellLock = value.cell.cellOutput.lock
    return cellLock.args === lock?.args && cellLock.codeHash === lock?.codeHash && cellLock.hashType === lock?.hashType
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

async function getOmnilockModel(lock: Script): Promise<OmnilockModel> {
  const lockHash = computeScriptHash(lock)
  const actorRef = new ActorReference('omnilock', `/${lockHash}/`)
  let omnilockModel = appRegistry.find<OmnilockModel>(actorRef.uri)
  if (!omnilockModel) {
    class NewStore extends OmnilockModel {}
    Reflect.defineMetadata(ProviderKey.Actor, { ref: actorRef }, NewStore)
    Reflect.defineMetadata(ProviderKey.CellPattern, createCellPattern(lock), NewStore)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    appRegistry.bind(NewStore as any)
    omnilockModel = appRegistry.find<OmnilockModel>(actorRef.uri)
    if (!omnilockModel) throw new Error('ominilock bind error')
    await Manager.call('local://resource', new ActorReference('register'), {
      pattern: lockHash,
      value: { type: 'register', register: { lockScript: lock, uri: actorRef.uri, pattern: lockHash } },
    })
    return omnilockModel
  }
  return omnilockModel
}

async function getRecordModel(lock: Script): Promise<RecordModel> {
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

router.post<never, never, { lock: Script; capacity: HexString }>('/claim', async (ctx) => {
  const lock = ctx.payload.body.lock
  const omnilockModel = await getOmnilockModel(lock)
  const result = omnilockModel.claim(lock, ctx.payload.body.capacity)
  // TODO use view to format tx
  ctx.ok(result)
})

router.get<{ path: string }, { args: string; codeHash: string; hashType: HashType }>('/read/:path', async (ctx) => {
  const lock: Script = {
    args: ctx.payload.params.args,
    codeHash: ctx.payload.params.codeHash,
    hashType: ctx.payload.params.hashType,
  }
  const recordModel = await getRecordModel(lock)
  const key = recordModel.getOneOfKey()
  const data = recordModel.get(key, ['data'])
  const path = ctx.payload.query?.path
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (path && path in data && (data as any)[path]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ctx.ok(Read.toJsonString((data as any)[path]))
  } else {
    ctx.err('There is no data with path')
  }
})

router.get<never, { args: string; codeHash: string; hashType: HashType }>('/load', async (ctx) => {
  const lock: Script = {
    args: ctx.payload.params.args,
    codeHash: ctx.payload.params.codeHash,
    hashType: ctx.payload.params.hashType,
  }
  const recordModel = await getRecordModel(lock)
  const key = recordModel.getOneOfKey()
  const data = recordModel.get(key, ['data'])
  ctx.ok(Load.toJsonString({ data }))
})

router.post<never, never, { lock: Script; value: StoreType['data'] }>('/set', async (ctx) => {
  const lock = ctx.payload.body.lock
  const recordModel = await getRecordModel(lock)
  const result = recordModel.update(ctx.payload.body.value)
  // TODO use view to format tx
  ctx.ok(result)
})

router.post<never, never, { lock: Script }>('/clear', async (ctx) => {
  const lock = ctx.payload.body.lock
  const recordModel = await getRecordModel(lock)
  const result = recordModel.clear()
  // TODO use view to format tx
  ctx.ok(result)
})

export { router }
