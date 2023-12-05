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
import { ExplorerService } from '../services/explorer.service'
import { BI, utils } from '@ckb-lumos/lumos'
import { MintRequest } from '../dto/mint.dto'
import { LockModel } from '../actors/lock.model'

@Controller('token')
export default class SudtController extends BaseController {
  #explorerHost = process.env.EXPLORER_HOST || 'https://explorer.nervos.org'
  constructor(
    private _dataSource: DataSource,
    private _explorerService: ExplorerService,
  ) {
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

  @Post('/send/:typeId')
  async send(@Body() { from, to, amount }: MintRequest, @Param('typeId') typeId: string) {
    if (!from?.length || !to || !amount) {
      throw new BadRequest('undefined body field: from, to or amount')
    }

    const token = await this._dataSource.getRepository(Token).findOneBy({ typeId })
    if (!token) {
      return SudtResponse.err('404', 'token not found')
    }

    const fromLocks = from.map((v) => getLock(v))

    const sudtModel = appRegistry.findOrBind<SudtModel>(
      new ActorReference('sudt', `/${token.args}/${fromLocks[0].args}/`),
    )

    const lockModel = LockModel.getLock(from[0])

    const result = sudtModel.send(lockModel, getLock(to), amount)
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

  @Post('/')
  async createToken(@Body() req: CreateTokenRequest) {
    let owner = await this._dataSource.getRepository(Account).findOneBy({ address: req.account })
    if (!owner) {
      owner = await this._dataSource
        .getRepository(Account)
        .save(this._dataSource.getRepository(Account).create({ address: req.account }))
    }

    const amount = BI.isBI(req.amount) ? BI.from(req.amount) : BI.from(0)
    try {
      const lockModel = LockModel.getLock(req.account)

      const { typeScript, ...result } = lockModel.mint(getLock(req.account), amount)

      await this._dataSource.getRepository(Token).save(
        this._dataSource.getRepository(Token).create({
          name: req.name,
          ownerId: owner.id,
          decimal: req.decimal,
          description: req.description,
          website: req.website,
          icon: req.icon,
          args: typeScript.args,
          typeId: utils.computeScriptHash(typeScript),
        }),
      )
      return new SudtResponse('201', Tx.toJsonString(result))
    } catch (e) {
      if (e instanceof QueryFailedError) {
        switch (e.driverError.code) {
          case 'ER_DUP_ENTRY':
            return SudtResponse.err('409', { message: 'Token already exists' })
        }
      }

      console.error(e)
      throw e
    }
  }

  @Put('/:typeId')
  async updateToken(@Body() req: CreateTokenRequest, @Param('typeId') typeId: string) {
    const token = await this._dataSource.getRepository(Token).findOneBy({ typeId })
    if (!token) {
      return SudtResponse.err('404', { message: 'Token not found' })
    }

    try {
      await this._explorerService.updateSUDT({
        typeHash: typeId,
        symbol: req.name,
        fullName: req.name,
        decimal: req.decimal.toString(),
        totalAmount: '0',
        description: req.description,
        operatorWebsite: req.website,
        iconFile: req.icon,
        uan: `${req.name}.ckb`,
        displayName: req.name,
        email: req.email,
        token: req.explorerCode,
      })
      await this._dataSource.getRepository(Token).save({ ...token, ...req })
      return new SudtResponse('201', {})
    } catch (e) {
      throw SudtResponse.err('500', { message: (e as Error).message })
    }
  }

  @Get('/:typeId')
  async getToken(@Param('typeId') typeId: string) {
    const token = await this._dataSource.getRepository(Token).findOneBy({ typeId })

    if (token) {
      return SudtResponse.ok(tokenEntityToDto(token, '0', this.#explorerHost))
    } else {
      throw new NotFound()
    }
  }

  @Get('/')
  async listTokens() {
    const tokens = await this._dataSource.getRepository(Token).find()

    return SudtResponse.ok(tokens.map((token) => tokenEntityToDto(token, '0', this.#explorerHost)))
  }
}
