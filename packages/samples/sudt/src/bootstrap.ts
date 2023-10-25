import Koa from 'koa'
import { koaBody } from 'koa-body'
import { getGenesisScriptsConfig, initialKuai } from '@ckb-js/kuai-core'
import { KoaRouterAdapter, CoR } from '@ckb-js/kuai-io'
import SudtController from './controllers/sudt.controller'
import {
  REDIS_HOST_SYMBOL,
  REDIS_OPT_SYMBOL,
  REDIS_PORT_SYMBOL,
  initiateResourceBindingManager,
  mqContainer,
} from '@ckb-js/kuai-models'
import { config } from '@ckb-lumos/lumos'
import { DataSource } from 'typeorm'
import { AccountController } from './controllers/account.controller'
import { ExplorerService } from './services/explorer.service'

const initiateDataSource = async () => {
  const dataSource = new DataSource({
    connectorPackage: 'mysql2',
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'sudt',
    entities: [__dirname + '/entities/*.{js,ts}'],
    synchronize: true,
  })

  await dataSource.initialize()

  return dataSource
}

export const bootstrap = async () => {
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

  const port = kuaiEnv.config?.port || 3000

  initiateResourceBindingManager({ rpc: kuaiEnv.config.ckbChain.rpcUrl })

  const app = new Koa()
  app.use(koaBody())

  const dataSource = await initiateDataSource()

  // init kuai io
  const cor = new CoR()
  const sudtController = new SudtController(dataSource, new ExplorerService())
  const accountController = new AccountController(dataSource)
  cor.use(sudtController.middleware())
  cor.use(accountController.middleware())

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
