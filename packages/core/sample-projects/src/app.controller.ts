import { BaseController, Controller, Get, Query } from '@ckb-js/kuai-io';
import { appRegistry } from './actors';
import { Actor, ActorNotFoundException } from '@ckb-js/kuai-models';

@Controller('/')
export default class AppController extends BaseController {
  @Get('/')
  async hello(@Query('name') name: string) {
    const appActor = appRegistry.find('local://app');

    if (!appActor) {
      throw new ActorNotFoundException('local://app');
    }

    await Actor.call(appActor.ref.uri, appActor.ref, {
      pattern: 'normal',
      value: {
        type: 'hello',
        hello: {
          name,
        },
      },
    });

    return `hello ${name || 'world'}`;
  }
}
