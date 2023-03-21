import type { StoreType } from './actors/record.model'
import { KuaiRouter } from '@ckb-js/kuai-io'
import { HexString, helpers } from '@ckb-lumos/lumos'
import { ActorReference } from '@ckb-js/kuai-models'
import { BadRequest } from 'http-errors'
import { appRegistry, OmnilockModel, RecordModel } from './actors'
import { computeScriptHash } from '@ckb-lumos/base/lib/utils'
import { Tx } from './views/tx.view'
import { MvpError } from './exception'
import { MvpResponse } from './response'

const router = new KuaiRouter()

const getLock = (address: string) => {
  try {
    return helpers.parseAddress(address)
  } catch {
    throw new BadRequest('invalid address')
  }
}

router.get<never, { address: string }>('/meta/:address', async (ctx) => {
  const omniLockModel = appRegistry.findOrBind<OmnilockModel>(
    new ActorReference('omnilock', `/${computeScriptHash(getLock(ctx.payload.params.address))}/`),
  )

  ctx.ok(MvpResponse.ok(omniLockModel?.meta))
})

router.post<never, { address: string }, { capacity: HexString }>('/claim/:address', async (ctx) => {
  const { body, params } = ctx.payload

  if (!body?.capacity) {
    throw new BadRequest('undefined body field: capacity')
  }

  const omniLockModel = appRegistry.findOrBind<OmnilockModel>(
    new ActorReference('omnilock', `/${computeScriptHash(getLock(params?.address))}/`),
  )
  const result = omniLockModel.claim(body.capacity)
  ctx.ok(MvpResponse.ok(Tx.toJsonString(result)))
})

router.get<never, { path: string; address: string }>('/load/:address/:path', async (ctx) => {
  const { params } = ctx.payload

  if (!params?.path) {
    throw new BadRequest('invalid path')
  }

  const recordModel = appRegistry.findOrBind<RecordModel>(
    new ActorReference('record', `/${computeScriptHash(getLock(params?.address))}/`),
  )
  const value = recordModel.load(`data.${params.path}`)
  if (value) {
    ctx.ok(MvpResponse.ok(MvpResponse.ok(value)))
  } else {
    throw new MvpError('field is not found', '404')
  }
})

router.get<never, { address: string }>('/load/:address', async (ctx) => {
  const lock = getLock(ctx.payload.params?.address)
  const recordModel = appRegistry.findOrBind<RecordModel>(
    new ActorReference('record', `/${lock.codeHash}/${lock.hashType}/${lock.args}/`),
  )
  const key = recordModel.getOneOfKey()
  if (!key) {
    throw new MvpError('store is not found', '404')
  }
  ctx.ok(MvpResponse.ok(recordModel.load('data')))
})

router.post<never, { address: string }, { value: StoreType['data'] }>('/set/:address', async (ctx) => {
  const recordModel = appRegistry.findOrBind<RecordModel>(
    new ActorReference('record', `/${computeScriptHash(getLock(ctx.payload.params?.address))}/`),
  )
  const result = recordModel.update(ctx.payload.body.value)
  ctx.ok(MvpResponse.ok(Tx.toJsonString(result)))
})

router.post<never, { address: string }>('/clear/:address', async (ctx) => {
  const recordModel = appRegistry.findOrBind<RecordModel>(
    new ActorReference('record', `/${computeScriptHash(getLock(ctx.payload.params?.address))}/`),
  )
  const result = recordModel.clear()
  ctx.ok(MvpResponse.ok(await Tx.toJsonString(result)))
})

export { router }
