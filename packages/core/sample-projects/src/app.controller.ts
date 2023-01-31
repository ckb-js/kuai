import { KuaiRouter } from '@ckb-js/kuai-io';
import { appRegistry } from './actors';
import { Actor } from '@ckb-js/kuai-models';

const router = new KuaiRouter();

router.get('/', async (ctx) => {
  const appActor = appRegistry.find('local://app');

  if (!appActor) {
    return ctx.err('not found app actor');
  }

  await Actor.call(appActor.ref.uri, appActor.ref, {
    pattern: 'normal',
    value: {
      type: 'hello',
      hello: {
        name: ctx?.payload?.query?.name,
      },
    },
  });

  ctx.ok(`hello ${ctx?.payload?.query?.name || 'world'}`);
});

export { router };
