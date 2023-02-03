import { jest, describe, it, expect } from '@jest/globals'
import type { CKBComponents } from '@ckb-lumos/rpc/lib/types/api'
import { TipHeaderListener } from '../src/listener'
import { timeout, distinctUntilChanged, catchError } from 'rxjs'
import type { Subscription } from 'rxjs'

import { ChainSource } from '../src/types'
import type { Script } from '@ckb-lumos/base'
/* eslint-disable-next-line @typescript-eslint/no-var-requires */
const { scheduler } = require('node:timers/promises')

describe('test Listener', () => {
  const mockHeader = {
    timestamp: '0x',
    number: '0x',
    epoch: '0x',
    compactTarget: '0x',
    dao: '0x',
    hash: '0x',
    nonce: '0x',
    parentHash: '0x',
    proposalsHash: '0x',
    transactionsRoot: '0x',
    extraHash: '0x',
    version: '0x',
  }
  const mockEpoch = {
    compactTarget: '0x',
    length: '0x',
    startNumber: '0x',
    number: '0x',
  }
  const mockBlock = {
    header: mockHeader,
    transactions: [],
    uncles: [],
    proposals: [],
  }

  const waitSubscriptionClose = async (sub: Subscription) => {
    while (!sub.closed) {
      await scheduler.wait(1000)
    }
  }

  const mockSource: ChainSource = {
    getTipBlockNumber: () => Promise.resolve('0x' + new Date().getSeconds().toString(16).padStart(2, '0')),
    getTipHeader: () =>
      Promise.resolve({
        ...mockHeader,
        number: '0x' + new Date().getSeconds().toString(16).padStart(2, '0'),
      }),
    getCurrentEpoch: () => Promise.resolve(mockEpoch),
    getBlock: () => Promise.resolve(mockBlock),
    getAllLiveCellsWithWitness: function (
      _lockScript: Script,
      _typeScript?: Script,
    ): Promise<(CKBComponents.IndexerCell & { witness: string })[]> {
      return Promise.resolve([])
    },
  }

  it(`distinctUntilChanged pipe `, async () => {
    const tipHeaders: CKBComponents.BlockHeader[] = []
    const subscribe = new TipHeaderListener(mockSource, 100)
      .getObservable()
      .pipe(distinctUntilChanged((a, b) => a.number === b.number))
      .subscribe((header) => {
        tipHeaders.push(header)
        if (tipHeaders.length === 4) {
          subscribe.unsubscribe()
          expect(tipHeaders[0].number).not.toMatch(tipHeaders[1].number)
          expect(tipHeaders[1].number).not.toMatch(tipHeaders[2].number)
          expect(tipHeaders[2].number).not.toMatch(tipHeaders[3].number)
        }
      })

    await waitSubscriptionClose(subscribe)
  })

  it(`custom pipe listener`, async () => {
    const slowMockSource: ChainSource = {
      ...mockSource,
      getTipHeader: async () => {
        await scheduler.wait(1000 * 60)
        return Promise.resolve({
          ...mockHeader,
          number: '0x' + new Date().getSeconds().toString(16).padStart(2, '0'),
        })
      },
    }

    const mockErrHadnle = jest.fn()

    const subscription = new TipHeaderListener(slowMockSource, 100)
      .getObservable()
      .pipe(
        timeout(1000),
        distinctUntilChanged((a, b) => a.number === b.number),
        catchError((err) => {
          mockErrHadnle(err.message)
          return '0x'
        }),
      )
      .subscribe(() => {
        subscription.unsubscribe()
      })
    await waitSubscriptionClose(subscription)

    expect(mockErrHadnle).toBeCalled()
    expect(mockErrHadnle).toBeCalledWith('Timeout has occurred')
  })
})
