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

router.post<never, { address: string }, { capacity: HexString }>('/claim/:address', async (ctx) => {
  const { body, params } = ctx.payload

  if (!params || !params.address) {
    throw new BadRequest('invalid address')
  }

  const lock = ((address: string) => {
    try {
      return helpers.parseAddress(address)
    } catch (e) {
      throw new BadRequest('invalid address')
    }
  })(params.address)

  if (!body || !body.capacity) {
    throw new BadRequest('undefined body field: capacity')
  }

  const omnilockModel = await getOmnilockModel(lock)
  const result = omnilockModel.claim(lock, body.capacity)
  ctx.ok(Tx.toJsonString(result))
})

router.get<never, { path: string; address: string }>('/read/:address/:path', async (ctx) => {
  const { params } = ctx.payload

  if (!params || !params.address) {
    throw new BadRequest('invalid address')
  }

  const lock = ((address: string) => {
    try {
      return helpers.parseAddress(address)
    } catch (e) {
      throw new BadRequest('invalid address')
    }
  })(params.address)

  if (!params || !params.path) {
    throw new BadRequest('invalid path')
  }

  const recordModel = await getRecordModel(lock)
  const key = recordModel.getOneOfKey()
  const data = recordModel.get(key, params.path ? ['data', ...params.path.split('.')] : ['data'])
  ctx.ok(data)
})

router.get<never, { address: string }>('/load/:address', async (ctx) => {
  const { params } = ctx.payload

  if (!params || !params.address) {
    throw new BadRequest('invalid address')
  }

  const lock = ((address: string) => {
    try {
      return helpers.parseAddress(address)
    } catch (e) {
      throw new BadRequest('invalid address')
    }
  })(params.address)

  const recordModel = await getRecordModel(lock)
  const key = recordModel.getOneOfKey()
  const data = recordModel.get(key, ['data'])
  ctx.ok(data)
})

router.post<never, { address: string }, { value: StoreType['data'] }>('/set/:address', async (ctx) => {
  const { params } = ctx.payload

  if (!params || !params.address) {
    throw new BadRequest('invalid address')
  }

  const lock = ((address: string) => {
    try {
      return helpers.parseAddress(address)
    } catch (e) {
      throw new BadRequest('invalid address')
    }
  })(params.address)

  const recordModel = await getRecordModel(lock)
  const result = recordModel.update(ctx.payload.body.value)
  ctx.ok(Tx.toJsonString(result))
})

router.post<never, { address: string }>('/clear/:address', async (ctx) => {
  const { params } = ctx.payload

  if (!params || !params.address) {
    throw new BadRequest('invalid address')
  }

  const lock = ((address: string) => {
    try {
      return helpers.parseAddress(address)
    } catch (e) {
      throw new BadRequest('invalid address')
    }
  })(params.address)

  const recordModel = await getRecordModel(lock)
  const result = recordModel.clear()
  ctx.ok(await Tx.toJsonString(result))
})

export { router }
