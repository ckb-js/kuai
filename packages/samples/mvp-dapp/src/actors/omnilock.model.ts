/**
 * @module src/actors/omnilock.model
 * @description
 * This is the actor model for omnilock, which is used to gather omnilock cells to generate record models.
 */

import type { Cell, HexString } from '@ckb-lumos/base'
import {
  ActorProvider,
  Omnilock,
  Param,
  ActorReference,
  CellPattern,
  JSONStore,
  OutPointString,
  SchemaPattern,
  UpdateStorageValue,
  DataPattern,
  LockPattern,
  JSONStorage,
} from '@ckb-js/kuai-models'
import { BI } from '@ckb-lumos/bi'
import { helpers } from '@ckb-lumos/lumos'
import { InternalServerError } from 'http-errors'
import { DAPP_DATA_PREFIX, TX_FEE, MVP_CONTRACT_TYPE_SCRIPT } from '../const'
import { bytes } from '@ckb-lumos/codec'

/**
 * add business logic in an actor
 */
@ActorProvider({ ref: { name: 'omnilock', path: `/:args/` } })
@LockPattern()
@DataPattern('0x')
@Omnilock()
export class OmnilockModel extends JSONStore<Record<string, never>> {
  #omnilockAddress: string

  constructor(
    @Param('args') args: string,
    _schemaOption?: void,
    params?: {
      states?: Record<OutPointString, never>
      chainData?: Record<OutPointString, UpdateStorageValue>
      cellPattern?: CellPattern
      schemaPattern?: SchemaPattern
    },
  ) {
    super(undefined, { ...params, ref: ActorReference.newWithPattern(OmnilockModel, `/${args}/`) })
    if (!this.lockScript) {
      throw new Error('lock script is required')
    }
    this.registerResourceBinding()
    this.#omnilockAddress = helpers.encodeToAddress(this.lockScript)
  }

  get meta(): Record<'capacity', string> {
    const cells = Object.values(this.chainData)
    const capacity = cells.reduce((acc, cur) => BigInt(cur.cell.cellOutput.capacity ?? 0) + acc, BigInt(0)).toString()
    return {
      capacity,
    }
  }

  claim(capacity: HexString): {
    inputs: Cell[]
    outputs: Cell[]
    witnesses: string[]
  } {
    const cells = Object.values(this.chainData)
    let currentTotalCapacity: BI = BI.from(0)
    // additional 0.001 ckb for tx fee
    const needCapacity = BI.from(capacity).add(TX_FEE)
    const inputs = cells.filter((v) => {
      if (currentTotalCapacity.gte(needCapacity)) return false
      currentTotalCapacity = currentTotalCapacity.add(BI.from(v.cell.cellOutput.capacity))
      return true
    })
    if (currentTotalCapacity.lt(needCapacity)) throw new InternalServerError('not enough capacity')

    const INITIAL_RECORD_STATE = bytes
      .hexify(
        new JSONStorage().serialize({ addresses: [{ key: 'ckb', value: this.#omnilockAddress, label: 'required' }] }),
      )
      .slice(2)

    return {
      inputs: inputs.map((v) => v.cell),
      outputs: [
        {
          cellOutput: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            lock: this.lockScript!,
            type: MVP_CONTRACT_TYPE_SCRIPT,
            capacity,
          },
          data: `${DAPP_DATA_PREFIX}${INITIAL_RECORD_STATE}`,
        },
        {
          cellOutput: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            lock: this.lockScript!,
            capacity: currentTotalCapacity.sub(needCapacity).toHexString(),
          },
          data: '0x',
        },
      ],
      witnesses: [],
    }
  }
}
