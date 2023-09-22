import type { HexString, Hash } from '@ckb-lumos/base'
import { BaseController, Controller, Body, Post } from '@ckb-js/kuai-io'
import { ActorReference } from '@ckb-js/kuai-models'
import { BadRequest } from 'http-errors'
import { SudtModel, appRegistry } from '../actors'
import { Tx } from '../views/tx.view'
import { getLock } from '../utils'
import { SudtResponse } from '../response'

@Controller('sudt')
export default class SudtController extends BaseController {
  @Post('/send')
  async send(
    @Body() { from, to, amount, typeArgs }: { from: string[]; to: string; amount: HexString; typeArgs: Hash },
  ) {
    if (!from?.length || !to || !amount || !typeArgs) {
      throw new BadRequest('undefined body field: from, to, amount or typeArgs')
    }

    const sudtModel = appRegistry.findOrBind<SudtModel>(new ActorReference('sudt', `/${typeArgs}/`))
    const result = sudtModel.send(
      from.map((v) => getLock(v)),
      getLock(to),
      amount,
    )
    return SudtResponse.ok(await Tx.toJsonString(result))
  }

  @Post('/destory')
  async destory(@Body() { from, amount, typeArgs }: { from: string[]; amount: HexString; typeArgs: Hash }) {
    if (!from) {
      throw new BadRequest('undefined body field: from')
    }

    const sudtModel = appRegistry.findOrBind<SudtModel>(new ActorReference('sudt', `/${typeArgs}/`))
    const result = sudtModel.destory(
      from.map((v) => getLock(v)),
      amount,
    )
    return SudtResponse.ok(await Tx.toJsonString(result))
  }
}
