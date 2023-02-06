import { KuaiRouter } from '@ckb-js/kuai-io'
import { helpers } from '@ckb-lumos/lumos'
import { Actor } from '@ckb-js/kuai-models'
import type { types } from '@ckb-js/kuai-io'
import { appRegistry } from './actors'
import { Tx } from './views/tx.view'
import { Load } from './views/load.view'
import { Read } from './views/read.view'

const { TransactionSkeleton } = helpers

const router = new KuaiRouter()

router.post('/claim', async (ctx) => {
  const txSkeleton = new TransactionSkeleton()
  // findCells

  ctx.ok(Tx.toJsonString(txSkeleton, [], []))
})

router.get('/read/:path', async (ctx) => {
  const storage = appRegistry.find('local://storage')

  if (!storage) {
    return ctx.err('not found storage')
  }

  await Actor.call(storage.ref.uri, storage.ref, {
    pattern: 'normal',
    value: {
      type: 'fetch',
      fetch: {
        path: ctx.payload.params?.path,
      },
    },
  })

  ctx.ok(
    Read.toJsonString({
      key: '',
      value: '',
      label: '',
    }),
  )
})

router.get('/load', async (ctx) => {
  // TODO: find storage
  ctx.ok(
    Load.toJsonString({
      data: {
        profile: [],
        addresses: [],
        custom: [],
        dweb: [],
      },
    }),
  )
})

router.post(
  '/set',
  async (
    ctx: types.RouterExtendContext<Record<string, never>, Record<string, never>, { path: string; value: string }>,
  ) => {
    const txSkeleton = new TransactionSkeleton()

    const storage = appRegistry.find('local://storage')

    if (!storage) {
      return ctx.err('not found storage')
    }

    await Actor.call(storage.ref.uri, storage.ref, {
      pattern: 'normal',
      value: {
        type: 'set',
        set: {
          path: ctx.payload.body?.path,
          value: ctx.payload.body?.value,
        },
      },
    })

    ctx.ok(Tx.toJsonString(txSkeleton, [], []))
  },
)

router.post('/clear', async (ctx) => {
  const txSkeleton = new TransactionSkeleton()

  ctx.ok(Tx.toJsonString(txSkeleton, [], []))
})

export { router }
