import { BaseController, Body, Controller, Get, Param, Post } from '@ckb-js/kuai-io'
import { DataSource } from 'typeorm'
import { Transaction } from '../entities/transaction.entity'
import { Account } from '../entities/account.entity'
import { OmnilockModel, appRegistry } from '../actors'
import { ActorReference } from '@ckb-js/kuai-models'
import { getLock } from '../utils'
import { SudtResponse } from '../response'
import { Token } from '../entities/token.entity'
import { BadRequest } from 'http-errors'
import { Tx } from '../views/tx.view'
import { MintRequest } from '../dto/mint.dto'
import { BI } from '@ckb-lumos/lumos'
import { Asset } from '../entities/asset.entity'

@Controller('/account')
export class AccountController extends BaseController {
  #explorerHost = process.env.EXPLORER_HOST || 'https://explorer.nervos.org'
  constructor(private _dataSource: DataSource) {
    super()
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

    const omniLockModel = appRegistry.findOrBind<OmnilockModel>(
      new ActorReference('omnilock', `/${getLock(from[0]).args}/`),
    )

    const result = omniLockModel.mint(getLock(to), BI.isBI(amount) ? BI.from(amount) : BI.from(0), token.args)

    return SudtResponse.ok(await Tx.toJsonString(result))
  }

  @Get('/meta/:address')
  async meta(@Param('address') address: string) {
    if (!address) {
      throw new Request('invalid address')
    }

    const repo = this._dataSource.getRepository(Account)
    const account = await repo.findBy({ address })
    if (!account) {
      repo.save(repo.create({ address }))
    }

    const omniLockModel = appRegistry.findOrBind<OmnilockModel>(
      new ActorReference('omnilock', `/${getLock(address).args}/`),
    )

    return SudtResponse.ok(omniLockModel?.meta)
  }

  @Get('/:address/assets/transaction')
  async accountTransaction(@Param('address') address: string) {
    const account = await this._dataSource.getRepository(Account).findOneBy({ address })
    if (!account) {
      return []
    }

    const txs = await this._dataSource.getRepository(Transaction).findBy({ fromAccountId: account.id })
    return txs.map((tx) => ({
      txHash: tx.txHash,
      from: tx.fromAccountId,
      to: tx.toAccountId,
      time: tx.createdAt,
      status: tx.status,
      sudtAmount: tx.sudtAmount,
      ckbAmount: tx.ckbAmount,
      url: `${this.#explorerHost}/transaction/${tx.txHash}`,
    }))
  }

  @Get('/:address/assets')
  async accountAssets(@Param('address') address: string) {
    const tokens = await this._dataSource.getRepository(Token).find()
    const account = await this._dataSource.getRepository(Account).findOneBy({ address })
    if (!account) {
      throw SudtResponse.err(404, 'account not found')
    }

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

  // @Post('/transfer/:typeId')
  //   async transfer(@Param('tokenId') typeId: string, @Body() { from, to, amount }: MintRequest) {
  //     if (!from || from.length === 0 || !to || !amount) {
  //       throw new BadRequest('undefined body field: from, to or amount')
  //     }

  //     const token = await this._dataSource.getRepository(Token).findOneBy({ typeId })
  //     if (!token) {
  //       return SudtResponse.err(404, 'token not found')
  //     }

  //     const sudt = appRegistry.findOrBind<SudtModel>(new ActorReference('sudt', `/${token.args}/`))

  //     const result = sudt.send(getLock(to), amount)

  //     return Tx.toJsonString(result)
  //   }
}
