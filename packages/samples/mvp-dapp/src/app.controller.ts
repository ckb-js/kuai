import { KuaiRouter } from '@ckb-js/kuai-io'
import { helpers } from '@ckb-lumos/lumos'
import { Actor } from '@ckb-js/kuai-models'
import type { types } from '@ckb-js/kuai-io'
import { appRegistry } from './actors'

const { TransactionSkeleton, createTransactionFromSkeleton } = helpers

const router = new KuaiRouter()

router.post('/claim', async (ctx) => {
  const txSkeleton = new TransactionSkeleton()
  // findCells

  ctx.ok(createTransactionFromSkeleton(txSkeleton))
})

router.get('/read/:path', async (ctx) => {
  const storage = appRegistry.find('local://storage')

  if (!storage) {
    return ctx.err('not found storage')
  }

  const res = await Actor.call(storage.ref.uri, storage.ref, {
    pattern: 'normal',
    value: {
      type: 'fetch',
      fetch: {
        path: ctx.payload.params?.path,
      },
    },
  })

  ctx.ok(JSON.stringify(res.message))
})

router.get('/load', async (ctx) => {
  ctx.ok('mock load')
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

    ctx.ok(createTransactionFromSkeleton(txSkeleton))
  },
)

router.post('/clear', async (ctx) => {
  const txSkeleton = new TransactionSkeleton()

  ctx.ok(createTransactionFromSkeleton(txSkeleton))
})

export { router }
