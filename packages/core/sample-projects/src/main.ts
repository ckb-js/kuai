import Koa from 'koa';
import { koaBody } from 'koa-body';
import { initialKuai } from '@ckb-js/kuai-core';
import { KoaRouterAdapter, CoR } from '@ckb-js/kuai-io';
import { router } from './app.controller';
import './type-extends';

async function bootstrap() {
  const kuaiCtx = await initialKuai();
  const kuaiEnv = kuaiCtx.getRuntimeEnvironment();
  const port = kuaiEnv.config?.port || 3000;

  const app = new Koa();
  app.use(koaBody());

  // init kuai io
  const cor = new CoR();
  cor.use(router.middleware());

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
