import type { StoreType } from './actors/record.model'
import { KuaiRouter } from '@ckb-js/kuai-io'
import { HexString, helpers } from '@ckb-lumos/lumos'
import { ActorReference, resourceBindingRegisterMiddleware, lockMiddleware } from '@ckb-js/kuai-models'
import { BadRequest } from 'http-errors'
import { appRegistry, OmnilockModel, RecordModel } from './actors'
import { computeScriptHash } from '@ckb-lumos/base/lib/utils'
import { Tx } from './views/tx.view'
import { cellPatternMiddleware, recordPatternMiddleware } from './middleware'
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

router.get<never, { address: string }>(
  '/meta/:address',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resourceBindingRegisterMiddleware('omnilock', OmnilockModel),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lockMiddleware('omnilock', OmnilockModel),
  cellPatternMiddleware(),
  async (ctx) => {
    const omniLockModel = appRegistry.findOrBind<OmnilockModel>(
      new ActorReference('omnilock', `/${computeScriptHash(getLock(ctx.payload.params.address))}/`),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      OmnilockModel,
    )

    ctx.ok(MvpResponse.ok(omniLockModel?.meta))
  },
)

router.post<never, { address: string }, { capacity: HexString }>(
  '/claim/:address',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resourceBindingRegisterMiddleware('omnilock', OmnilockModel),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lockMiddleware('omnilock', OmnilockModel),
  cellPatternMiddleware(),
  async (ctx) => {
    const { body, params } = ctx.payload

    if (!body?.capacity) {
      throw new BadRequest('undefined body field: capacity')
    }

    const omniLockModel = appRegistry.findOrBind<OmnilockModel>(
      new ActorReference('omnilock', `/${computeScriptHash(getLock(params?.address))}/`),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      OmnilockModel,
    )
    const result = omniLockModel.claim(body.capacity)
    ctx.ok(MvpResponse.ok(Tx.toJsonString(result)))
  },
)

router.get<never, { path: string; address: string }>(
  '/load/:address/:path',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resourceBindingRegisterMiddleware('record', RecordModel),
  recordPatternMiddleware(),
  async (ctx) => {
    const { params } = ctx.payload

    if (!params?.path) {
      throw new BadRequest('invalid path')
    }

    const recordModel = appRegistry.findOrBind<RecordModel>(
      new ActorReference('record', `/${computeScriptHash(getLock(params?.address))}/`),
      RecordModel,
    )
    const value = recordModel.load(`data.${params.path}`)
    if (value) {
      ctx.ok(MvpResponse.ok(MvpResponse.ok(value)))
    } else {
      throw new MvpError('field is not found', '404')
    }
  },
)

router.get<never, { address: string }>(
  '/load/:address',
  resourceBindingRegisterMiddleware('record', RecordModel),
  recordPatternMiddleware(),
  async (ctx) => {
    const recordModel = appRegistry.findOrBind<RecordModel>(
      new ActorReference('record', `/${computeScriptHash(getLock(ctx.payload.params?.address))}/`),
      RecordModel,
    )
    const key = recordModel.getOneOfKey()
    if (!key) {
      throw new MvpError('store is not found', '404')
    }
    ctx.ok(MvpResponse.ok(recordModel.load('data')))
  },
)

router.post<never, { address: string }, { value: StoreType['data'] }>(
  '/set/:address',
  resourceBindingRegisterMiddleware('record', RecordModel),
  recordPatternMiddleware(),
  async (ctx) => {
    const recordModel = appRegistry.findOrBind<RecordModel>(
      new ActorReference('record', `/${computeScriptHash(getLock(ctx.payload.params?.address))}/`),
      RecordModel,
    )
    const result = recordModel.update(ctx.payload.body.value)
    ctx.ok(MvpResponse.ok(Tx.toJsonString(result)))
  },
)

router.post<never, { address: string }>(
  '/clear/:address',
  resourceBindingRegisterMiddleware('record', RecordModel),
  recordPatternMiddleware(),
  async (ctx) => {
    const recordModel = appRegistry.findOrBind<RecordModel>(
      new ActorReference('record', `/${computeScriptHash(getLock(ctx.payload.params?.address))}/`),
      RecordModel,
    )
    const result = recordModel.clear()
    ctx.ok(MvpResponse.ok(await Tx.toJsonString(result)))
  },
)

export { router }
