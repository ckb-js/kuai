import type { HexString } from '@ckb-lumos/base';
import { BaseController, Controller, Body, Post } from '@ckb-js/kuai-io';
import { ActorReference } from '@ckb-js/kuai-models';
import { BadRequest } from 'http-errors';
import { SudtModel, appRegistry } from '../actors';
import { utils } from '@ckb-lumos/base';
import { Tx } from '../views/tx.view';
import { getLock } from '../utils';
import { SudtResponse } from '../response';

@Controller('sudt')
export default class SudtController extends BaseController {
  @Post('/send')
  async send(@Body() { from, to, amount }: { from: string; to: string; amount: HexString }) {
    if (!from || !to || !amount) {
      throw new BadRequest('undefined body field: from, to or amount');
    }

    const typeArgs = utils.computeScriptHash(getLock(from));

    const sudtModel = appRegistry.findOrBind<SudtModel>(
      new ActorReference('sudt', `/${getLock(from).args}/${typeArgs}/`),
    );
    const result = sudtModel.send(getLock(to), amount);
    return SudtResponse.ok(await Tx.toJsonString(result));
  }

  @Post('/destory')
  async destory(@Body() { from, amount }: { from: string; amount: HexString }) {
    if (!from) {
      throw new BadRequest('undefined body field: from');
    }

    const typeArgs = utils.computeScriptHash(getLock(from));

    const sudtModel = appRegistry.findOrBind<SudtModel>(
      new ActorReference('sudt', `/${getLock(from).args}/${typeArgs}/`),
    );
    const result = sudtModel.destory(amount);
    return SudtResponse.ok(await Tx.toJsonString(result));
  }
}
