import type { HexString } from '@ckb-lumos/base';
import { BaseController, Controller, Get, Param, Post, Body } from '@ckb-js/kuai-io';
import { ActorReference } from '@ckb-js/kuai-models';
import { BadRequest } from 'http-errors';
import { OmnilockModel, appRegistry } from '../actors';
import { getLock } from '../utils';
import { Tx } from '../views/tx.view';
import { SudtResponse } from '../response';

@Controller('omnilock')
export default class OmnilockController extends BaseController {
  @Get('/meta/:address')
  async meta(@Param('address') address: string) {
    if (!address) {
      throw new BadRequest('invalid address');
    }

    const omniLockModel = appRegistry.findOrBind<OmnilockModel>(
      new ActorReference('omnilock', `/${getLock(address).args}/`),
    );

    return SudtResponse.ok(omniLockModel?.meta);
  }

  @Post('/mint')
  async mint(@Body() { from, to, amount }: { from: string; to: string; amount: HexString }) {
    if (!from || !to || !amount) {
      throw new BadRequest('undefined body field: from, to or amount');
    }

    const omniLockModel = appRegistry.findOrBind<OmnilockModel>(
      new ActorReference('omnilock', `/${getLock(from).args}/`),
    );
    const result = omniLockModel.mint(getLock(to), amount);
    return SudtResponse.ok(await Tx.toJsonString(result));
  }
}
