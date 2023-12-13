import { BaseController, Body, Controller, Get, Param, Post, Query } from '@ckb-js/kuai-io'
import { DataSource } from 'typeorm'
import { Account } from '../entities/account.entity'
import { getLock } from '../utils'
import { SudtResponse } from '../response'
import { Token } from '../entities/token.entity'
import { BadRequest } from 'http-errors'
import { Tx } from '../views/tx.view'
import { MintRequest } from '../dto/mint.dto'
import { BI } from '@ckb-lumos/lumos'
import { getConfig } from '@ckb-lumos/config-manager'
import { Asset } from '../entities/asset.entity'
import { LockModel } from '../actors/lock.model'
import { NervosService } from '../services/nervos.service'

@Controller('/account')
export class AccountController extends BaseController {
  #explorerHost = process.env.EXPLORER_HOST || 'https://explorer.nervos.org'
  constructor(
    private _dataSource: DataSource,
    private _nervosService: NervosService,
  ) {
    super()
  }

  async getOrCreateAccount(address: string) {
    const repo = this._dataSource.getRepository(Account)
    const account = await repo.findOneBy({ address })
    if (account) {
      return account
    }

    LockModel.getLock(address)

    return repo.save(repo.create({ address }))
  }

  @Post('/mint/:typeId')
  async mint(@Body() { from, to, amount }: MintRequest, @Param('typeId') typeId: string) {
    if (!from || from.length === 0 || !to || !amount) {
      throw new BadRequest('undefined body field: from, to or amount')
    }

    const token = await this._dataSource.getRepository(Token).findOneBy({ typeId })
    if (!token) {
      return SudtResponse.err(404, 'token not found')
    }

    const lockModel = LockModel.getLock(from[0])

    const result = lockModel.mint(getLock(to), BI.isBI(amount) ? BI.from(amount) : BI.from(0), token.args)

    return SudtResponse.ok(await Tx.toJsonString(result))
  }

  @Get('/meta/:address')
  async meta(@Param('address') address: string) {
    if (!address) {
      throw new Request('invalid address')
    }
    await this.getOrCreateAccount(address)

    const lockModel = LockModel.getLock(address)

    return SudtResponse.ok(lockModel?.meta)
  }

  @Get('/:address/assets/transaction/:typeId')
  async accountTransaction(
    @Param('address') address: string,
    @Param('typeId') typeId: string,
    @Query('size') size: number,
    @Query('lastCursor') lastCursor?: string,
  ) {
    const token = await this._dataSource.getRepository(Token).findOneBy({ typeId })
    if (!token) {
      return []
    }

    const typeScript = {
      codeHash: getConfig().SCRIPTS.SUDT!.CODE_HASH,
      hashType: getConfig().SCRIPTS.SUDT!.HASH_TYPE,
      args: token.args,
    }

    return this._nervosService.fetchTransferHistory(getLock(address), typeScript, size, lastCursor)
  }

  @Get('/:address/assets')
  async accountAssets(@Param('address') address: string) {
    const tokens = await this._dataSource.getRepository(Token).find()
    const account = await this.getOrCreateAccount(address)

    const assets = await this._dataSource.getRepository(Asset).findBy({ accountId: account.id })
    const assetsMap = assets.reduce((acc, cur) => {
      acc.set(cur.tokenId, cur)
      return acc
    }, new Map<number, Asset>())
    console.log(assetsMap)
    return tokens.map((token) => {
      try {
        return {
          uan: token.name,
          displayName: token.name,
          decimal: token.decimal,
          amount: assetsMap.get(token.id)?.balance ?? '0',
        }
      } catch (e) {
        console.error(e)
      }
    })
  }
}
