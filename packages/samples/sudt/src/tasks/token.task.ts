import { DataSource, Repository } from 'typeorm'
import { Token, TokenStatus } from '../entities/token.entity'
import { appRegistry } from '../actors'
import { TokenModel } from '../actors/token.model'
import { ActorReference } from '@ckb-js/kuai-models'
import { ExplorerService } from '../services/explorer.service'

export class TokenTask {
  #tokenRepo: Repository<Token>

  constructor(
    dataSource: DataSource,
    private _explorerService: ExplorerService,
    private _maxTimeFromCreate = 60 * 10 * 1000,
  ) {
    this.#tokenRepo = dataSource.getRepository(Token)
  }

  run = async () => {
    for (;;) {
      const newTokens = await this.#tokenRepo.findBy({ status: TokenStatus.New })
      for (const token of newTokens) {
        const tokenModel = appRegistry.findOrBind<TokenModel>(new ActorReference('token', `/${token.args}/`))
        if (tokenModel) {
          if (Date.now() - token.createdAt.getTime() > this._maxTimeFromCreate) {
            continue
          }
          try {
            console.log(token)
            await this._explorerService.updateSUDT({
              typeHash: token.typeId,
              symbol: token.name,
              decimal: token.decimal.toString(),
              totalAmount: '0',
              description: token.description ?? '',
              operatorWebsite: token.website,
            })

            token.status = TokenStatus.Committed
            await this.#tokenRepo.save(token)
          } catch (e) {
            console.error(e)
          }
        }
      }
    }
  }
}
