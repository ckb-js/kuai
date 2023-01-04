import { Block } from '@ckb-lumos/base'
import { Listener } from '../../../../io/src/listener'
import { ChainSource } from '../../../../io/src/types'
import { Observable } from 'rxjs'

export class TransactionListener extends Listener<Block> {
  constructor(private source: ChainSource, pollingInterval = 1000) {
    super(pollingInterval)
  }

  protected async emit(): Promise<Block> {
    return this.source.getCurrentBlock()
  }

  public getObservable(): Observable<Block> {
    return this._observable
  }
}
