/**
 * @module src/main
 * @description
 * This module is the entry of the application.
 * It initializes the kuai context and starts the application.
 */

import Koa from 'koa'
import { koaBody } from 'koa-body'
import { initialKuai, getGenesisScriptsConfig } from '@ckb-js/kuai-core'
import { config } from '@ckb-lumos/lumos'
import { KoaRouterAdapter, CoR } from '@ckb-js/kuai-io'
import cors from '@koa/cors'
import { router } from './app.controller'
import {
  mqContainer,
  REDIS_PORT_SYMBOL,
  REDIS_HOST_SYMBOL,
  initiateResourceBindingManager,
  REDIS_OPT_SYMBOL,
} from '@ckb-js/kuai-models'
import { handleException } from './exception'

async function bootstrap() {
  const kuaiCtx = await initialKuai()
  const kuaiEnv = kuaiCtx.getRuntimeEnvironment()

  if (kuaiEnv.config.redisPort) {
    mqContainer.bind(REDIS_PORT_SYMBOL).toConstantValue(kuaiEnv.config.redisPort)
  }

  if (kuaiEnv.config.redisHost) {
    mqContainer.bind(REDIS_HOST_SYMBOL).toConstantValue(kuaiEnv.config.redisHost)
  }

  if (kuaiEnv.config.redisOpt) {
    mqContainer.bind(REDIS_OPT_SYMBOL).toConstantValue(kuaiEnv.config.redisOpt)
  }

  config.initializeConfig(
    config.createConfig({
      PREFIX: kuaiEnv.config.ckbChain.prefix,
      SCRIPTS: kuaiEnv.config.ckbChain.scripts || {
        ...(await getGenesisScriptsConfig(kuaiEnv.config.ckbChain.rpcUrl)),
      },
    }),
  )

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const port = kuaiEnv.config.port || 3000
  const host = kuaiEnv.config.host || '127.0.0.1'

  initiateResourceBindingManager({ rpc: kuaiEnv.config.ckbChain.rpcUrl })

  const app = new Koa()
  app.use(koaBody())

  // init kuai io
  const cor = new CoR()
  cor.use(router.middleware())
  cor.useExceptionHandler(handleException())

  const koaRouterAdapter = new KoaRouterAdapter(cor)

  app.use(cors())
  app.use(koaRouterAdapter.routes())

  const server = app.listen(port, host, function () {
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

    console.info(`kuai app listening to ${address}`)
  })
}

bootstrap()
