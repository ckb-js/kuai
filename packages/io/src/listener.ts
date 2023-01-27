import type { CKBComponents } from '@ckb-lumos/rpc/lib/types/api'

import { Observable } from 'rxjs'
import { Listener as IListener, ChainSource } from './types'
import type { Subscription } from 'rxjs'

export class Listener<T> implements IListener<T> {
  protected _observable: Observable<T>

  constructor(private pollingInterval: number = 1000) {
    this._observable = this.polling()
  }

  protected emit(): Promise<T> | T {
    throw new Error('Method not implemented.')
  }

  protected polling(): Observable<T> {
    return new Observable<T>((subscriber) => {
      const timer = setInterval(async () => {
        subscriber.next(await this.emit())
      }, this.pollingInterval)

      return () => {
        clearInterval(timer)
      }
    })
  }

  public on(listen: (obj: T) => void): Subscription {
    return this._observable.subscribe(listen)
  }
}

export class TipHeaderListener extends Listener<CKBComponents.BlockHeader> {
  constructor(private source: ChainSource, pollingInterval = 1000) {
    super(pollingInterval)
  }

  protected async emit(): Promise<CKBComponents.BlockHeader> {
    return this.source.getTipHeader()
  }

  public getObservable(): Observable<CKBComponents.BlockHeader> {
    return this._observable
  }
}
