import Koa from 'koa'
import { koaBody } from 'koa-body'
import { initialKuai } from '@ckb-js/kuai-core'
import { config } from '@ckb-lumos/lumos'
import { KoaRouterAdapter, CoR, TipHeaderListener } from '@ckb-js/kuai-io'
import { router } from './app.controller'
import './type-extends'
import { ActorReference, Manager, ProviderKey } from '@ckb-js/kuai-models'
import { NervosChainSource } from './chain-source'

async function bootstrap() {
  const kuaiCtx = await initialKuai()
  const kuaiEnv = kuaiCtx.getRuntimeEnvironment()
  const lumosConfig: config.Config = (() => {
    if (kuaiEnv.config.lumosConfig === 'aggron4') {
      return config.predefined.AGGRON4
    }

    if (kuaiEnv.config.lumosConfig === 'lina') {
      return config.predefined.LINA
    }

    if (kuaiEnv.config.lumosConfig) {
      return kuaiEnv.config.lumosConfig
    }

    return { PREFIX: 'ckt', SCRIPTS: {} }
  })()

  config.initializeConfig(lumosConfig)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const port = (kuaiEnv.config as any)?.port || 3000

  Reflect.defineMetadata(ProviderKey.Actor, { ref: new ActorReference('resource', '/').json }, Manager)

  const dataSource = new NervosChainSource(kuaiEnv.config.rpcUrl)
  const listener = new TipHeaderListener(dataSource)
  const manager = new Manager(listener, dataSource)
  manager.listen()

  const app = new Koa()
  app.use(koaBody())

  // init kuai io
  const cor = new CoR()
  cor.use(router.middleware())

  const koaRouterAdapter = new KoaRouterAdapter(cor)

  app.use(koaRouterAdapter.routes())

  const server = app.listen(port, function () {
    const address = (() => {
      const _address = server.address()
      if (!_address) {
        return ''
      }

      if (typeof _address === 'string') {
        return _address
      }

      return `http://${_address.address}:${_address.port}`
    })()

    console.log(`kuai app listening at ${address}`)
  })
}

bootstrap()
