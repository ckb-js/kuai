import { BaseController, Body, Controller, Get, Param, Post } from '@ckb-js/kuai-io'
import { DataSource } from 'typeorm'
import { Transaction } from '../entities/transaction.entity'
import { Account } from '../entities/account.entity'
import { OmnilockModel, SudtModel, appRegistry } from '../actors'
import { ActorReference } from '@ckb-js/kuai-models'
import { getLock } from '../utils'
import { SudtResponse } from '../response'
import { Token } from '../entities/token.entity'
import { BadRequest } from 'http-errors'
import { HexString } from '@ckb-lumos/lumos'
import { Tx } from '../views/tx.view'

@Controller('/account')
export class AccountController extends BaseController {
  #explorerHost = process.env.EXPLORER_HOST || 'https://explorer.nervos.org'
  constructor(private _dataSource: DataSource) {
    super()
  }

  @Post('/mint')
  async mint(@Body() { from, to, amount }: { from: string; to: string; amount: HexString }) {
    if (!from || !to || !amount) {
      throw new BadRequest('undefined body field: from, to or amount')
    }

    const omniLockModel = appRegistry.findOrBind<OmnilockModel>(
      new ActorReference('omnilock', `/${getLock(from).args}/`),
    )

    const result = omniLockModel.mint(getLock(to), amount)

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
    const lock = getLock(address)
    return tokens.map((token) => {
      try {
        return {
          ...token,
          ...appRegistry
            .findOrBind<SudtModel>(new ActorReference('sudt', `/${lock.args}/${token.args}/`))
            .getSudtBalance([getLock(address)]),
        }
      } catch (e) {
        console.error(e)
      }
    })
  }
}
