import { DataSource, Repository } from 'typeorm'
import { scheduler } from 'node:timers/promises'
import { Account } from '../entities/account.entity'
import { Token } from '../entities/token.entity'
import { getLock } from '../utils'
import { SudtModel, appRegistry } from '../actors'
import { ActorReference } from '@ckb-js/kuai-models'
import { Asset } from '../entities/asset.entity'

export class BalanceTask {
  #accountRepo: Repository<Account>
  #tokenRepo: Repository<Token>
  #assetRepo: Repository<Asset>
  constructor(private _dataSource: DataSource) {
    this.#accountRepo = this._dataSource.getRepository(Account)
    this.#tokenRepo = this._dataSource.getRepository(Token)
    this.#assetRepo = this._dataSource.getRepository(Asset)
  }

  run = async () => {
    for (;;) {
      const accounts = await this.#accountRepo.find()
      const tokens = await this.#tokenRepo.find()
      for (const account of accounts) {
        try {
          const lockscript = getLock(account.address)
          for (const token of tokens) {
            const sudtModel = appRegistry.findOrBind<SudtModel>(
              new ActorReference('sudt', `/${token.args}/${lockscript.args}/`),
            )

            const balance = sudtModel.getSudtBalance()
            let asset = await this.#assetRepo.findOneBy({ typeId: token.typeId, accountId: account.id })

            if (!asset) {
              asset = this.#assetRepo.create({
                accountId: account.id,
                tokenId: token.id,
                typeId: token.typeId,
                balance: balance.sudtBalance.toString(),
              })
            } else {
              asset.setBalance(balance.sudtBalance)
            }

            await this.#assetRepo.save(asset)
          }
        } catch (e) {
          console.error(e)
        }
      }
      await scheduler.wait(1000)
    }
  }
}
