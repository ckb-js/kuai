import { BaseController, Controller, Get, Param, Query } from '@ckb-js/kuai-io'
import { DataSource } from 'typeorm'
import { Account } from '../entities/account.entity'
import { SudtResponse } from '../response'
import { Token } from '../entities/token.entity'
import { getLock } from '../utils'
import { encodeToAddress } from '@ckb-lumos/helpers'
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

  @Get('/meta/:address')
  async meta(@Param('address') address: string) {
    if (!address) {
      throw new Request('invalid address')
    }
    await this.getOrCreateAccount(address)

    const lockModel = LockModel.getLock(address)

    return SudtResponse.ok(lockModel?.meta)
  }

  @Get('/:address/assets/transaction')
  async accountTransaction(
    @Param('address') address: string,
    @Query('size') size: number,
    @Query('lastCursor') lastCursor?: string,
  ) {
    const tokens = await this._dataSource.getRepository(Token).find()

    if (tokens.length === 0) {
      return { lastCursor: '', history: [] }
    }

    const tokenMap = tokens.reduce((acc, cur) => {
      acc.set(cur.typeId, cur)
      return acc
    }, new Map<string, Token>())

    const history = await this._nervosService.fetchTransferHistory(
      getLock(address),
      tokens.map((token) => token.typeId),
      size,
      lastCursor,
    )

    console.log(history)

    return {
      ...history,
      ...{
        history: history.history.map((tx) => ({
          ...tx,
          ...{
            list: tx.list.map((item) => ({
              from: item.from.map((from) => ({
                token: tokenMap.get(item.typeId),
                typeId: item.typeId,
                amount: from.amount,
                address: encodeToAddress(from.lock),
              })),
              to: item.to.map((to) => ({
                token: tokenMap.get(item.typeId),
                typeId: item.typeId,
                amount: to.amount,
                address: encodeToAddress(to.lock),
              })),
            })),
          },
        })),
      },
    }
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
    return tokens.map((token) => {
      try {
        return {
          uan: token.name,
          displayName: token.name,
          decimal: token.decimal,
          amount: assetsMap.get(token.id)?.balance ?? '0',
          typeId: token.typeId,
        }
      } catch (e) {
        console.error(e)
      }
    })
  }
}
