import Koa from 'koa';
import { koaBody } from 'koa-body';
import { getGenesisScriptsConfig, initialKuai } from '@ckb-js/kuai-core';
import { KoaRouterAdapter, CoR } from '@ckb-js/kuai-io';
import AppController from './app.controller';
import './type-extends';
import { REDIS_HOST_SYMBOL, REDIS_PORT_SYMBOL, initiateResourceBindingManager, mqContainer } from '@ckb-js/kuai-models';
import { config } from '@ckb-lumos/lumos';

async function bootstrap() {
  const kuaiCtx = await initialKuai();
  const kuaiEnv = kuaiCtx.getRuntimeEnvironment();

  if (kuaiEnv.config.redisPort) {
    mqContainer.bind(REDIS_PORT_SYMBOL).toConstantValue(kuaiEnv.config.redisPort);
  }

  if (kuaiEnv.config.redisHost) {
    mqContainer.bind(REDIS_HOST_SYMBOL).toConstantValue(kuaiEnv.config.redisHost);
  }

  config.initializeConfig(
    config.createConfig({
      PREFIX: kuaiEnv.config.ckbChain.prefix,
      SCRIPTS: kuaiEnv.config.ckbChain.scripts || {
        ...(await getGenesisScriptsConfig(kuaiEnv.config.ckbChain.rpcUrl)),
      },
    }),
  );

  const port = kuaiEnv.config?.port || 3000;

  initiateResourceBindingManager({ rpc: kuaiEnv.config.ckbChain.rpcUrl });

  const app = new Koa();
  app.use(koaBody());

  // init kuai io
  const cor = new CoR();
  const appController = new AppController();
  cor.use(appController.middleware());

  const koaRouterAdapter = new KoaRouterAdapter(cor);

  app.use(koaRouterAdapter.routes());

  const server = app.listen(port, function () {
    const address = (() => {
      const _address = server.address();
      if (!_address) {
        return '';
      }

      if (typeof _address === 'string') {
        return _address;
      }

      return `http://${_address.address}:${_address.port}`;
    })();

    console.log(`kuai app listening at ${address}`);
  });
}

bootstrap();
