import type { HexString, Hash } from '@ckb-lumos/base'
import { ActorReference } from '@ckb-js/kuai-models'
import { BadRequest, NotFound } from 'http-errors'
import { SudtModel, appRegistry } from '../actors'
import { Tx } from '../views/tx.view'
import { getLock } from '../utils'
import { BaseController, Body, Controller, Get, Param, Post, Put } from '@ckb-js/kuai-io'
import { SudtResponse } from '../../response'
import { CreateTokenRequest } from '../dto/create-token.dto'
import { DataSource, QueryFailedError } from 'typeorm'
import { Token } from '../entities/token.entity'
import { Account } from '../entities/account.entity'
import { tokenEntityToDto } from '../dto/token.dto'

@Controller('sudt')
export default class SudtController extends BaseController {
  #explorerHost = process.env.EXPLORER_HOST || 'https://explorer.nervos.org'
  constructor(private _dataSource: DataSource) {
    super()
  }

  @Get('/meta/:typeArgs')
  async meta(@Param('typeArgs') typeArgs: string) {
    if (!typeArgs) {
      throw new BadRequest('invalid typeArgs')
    }

    const sudtModel = appRegistry.findOrBind<SudtModel>(new ActorReference('sudt', `/${typeArgs}/`))

    return SudtResponse.ok(sudtModel.meta())
  }

  @Post('/getSudtBalance')
  async getSudtBalance(@Body() { addresses, typeArgs }: { addresses: string[]; typeArgs: Hash }) {
    if (!addresses?.length || !typeArgs) {
      throw new BadRequest('undefined body field: from or typeArgs')
    }

    const sudtModel = appRegistry.findOrBind<SudtModel>(new ActorReference('sudt', `/${typeArgs}/`))

    return SudtResponse.ok(sudtModel.getSudtBalance(addresses.map((v) => getLock(v))))
  }

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

  @Post('/token')
  async createToken(@Body() req: CreateTokenRequest) {
    let owner = await this._dataSource.getRepository(Account).findOneBy({ address: req.account })
    if (!owner) {
      owner = await this._dataSource
        .getRepository(Account)
        .save(this._dataSource.getRepository(Account).create({ address: req.account }))
    }

    try {
      const token = await this._dataSource
        .getRepository(Token)
        .save(this._dataSource.getRepository(Token).create({ ...req, ownerId: owner.id }))
      return new SudtResponse('201', { url: `${this.#explorerHost}/transaction/${token.typeId}` })
    } catch (e) {
      if (e instanceof QueryFailedError) {
        switch (e.driverError.code) {
          case 'ER_DUP_ENTRY':
            return SudtResponse.err('409', { message: 'Token already exists' })
        }
      }

      console.error(e)
    }
  }

  @Put('/token')
  async updateToken(@Body() req: CreateTokenRequest) {
    const token = await this._dataSource.getRepository(Token).findOneBy({ typeId: req.typeId })
    if (token) {
      await this._dataSource.getRepository(Token).save({ ...token, ...req })
    }

    return new SudtResponse('201', {})
  }

  @Get('/token/:typeId')
  async getToken(@Param('typeId') typeId: string) {
    const token = await this._dataSource.getRepository(Token).findOneBy({ typeId })

    if (token) {
      return SudtResponse.ok(tokenEntityToDto(token, '0', this.#explorerHost))
    } else {
      throw new NotFound()
    }
  }

  @Get('/tokens')
  async listTokens() {
    const tokens = await this._dataSource.getRepository(Token).find()

    return SudtResponse.ok(tokens.map((token) => tokenEntityToDto(token, '0', this.#explorerHost)))
  }
}
