/**
 * @module src/actors/omnilock.model
 * @description
 * This is the actor model for omnilock, which is used to gather omnilock cells to generate record models.
 */

import type { Cell, Script } from '@ckb-lumos/base'
import {
  ActorProvider,
  Omnilock,
  Param,
  ActorReference,
  CellPattern,
  OutPointString,
  SchemaPattern,
  UpdateStorageValue,
  LockFilter,
  DataFilter,
} from '@ckb-js/kuai-models'
import { BI } from '@ckb-lumos/bi'
import { number, bytes } from '@ckb-lumos/codec'
import { utils } from '@ckb-lumos/base'
import { getConfig } from '@ckb-lumos/config-manager'
import { InternalServerError } from 'http-errors'
import { MIN_SUDT_WITH_OMINILOCK, TX_FEE } from '../const'
import { LockModel } from './lock.model'

/**
 * add business logic in an actor
 */
@ActorProvider({ ref: { name: 'omnilock', path: `/:args/` } })
@LockFilter()
@Omnilock()
@DataFilter('0x')
export class OmnilockModel extends LockModel {
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
    super(undefined, { ...params, ref: ActorReference.newWithFilter(OmnilockModel, `/${args}/`) })
    if (!this.lockScript) {
      throw new Error('lock script is required')
    }
    this.registerResourceBinding()
  }

  get meta(): Record<'capacity', string> {
    const cells = Object.values(this.chainData).filter((v) => !v.cell.cellOutput.type)
    const capacity = cells.reduce((acc, cur) => BigInt(cur.cell.cellOutput.capacity ?? 0) + acc, BigInt(0)).toString()
    return {
      capacity,
    }
  }

  loadCapacity = (capacity: BI) => {
    const cells = Object.values(this.chainData)
    let currentTotalCapacity = BI.from(0)
    const inputs = cells.filter((v) => {
      if (currentTotalCapacity.gte(capacity)) return false
      currentTotalCapacity = currentTotalCapacity.add(BI.from(v.cell.cellOutput.capacity))
      return true
    })

    if (currentTotalCapacity.lt(capacity)) throw new InternalServerError('not enough capacity')

    return { inputs, currentTotalCapacity }
  }

  mint = (
    lockScript: Script,
    amount: BI,
    args?: string,
  ): {
    inputs: Cell[]
    outputs: Cell[]
    witnesses: string[]
    typeScript: Script
  } => {
    const CONFIG = getConfig()
    const typeScript = {
      codeHash: CONFIG.SCRIPTS.SUDT!.CODE_HASH,
      hashType: CONFIG.SCRIPTS.SUDT!.HASH_TYPE,
      args: args ?? utils.computeScriptHash(lockScript),
    }
    const sudtCell: Cell = {
      cellOutput: {
        capacity: BI.from(MIN_SUDT_WITH_OMINILOCK).toHexString(),
        lock: lockScript,
        type: typeScript,
      },
      data: bytes.hexify(number.Uint128LE.pack(amount.toHexString())),
    }
    // additional 0.001 ckb for tx fee
    const needCapacity = BI.from(sudtCell.cellOutput.capacity).add(TX_FEE)
    const { inputs, currentTotalCapacity } = this.loadCapacity(needCapacity)

    return {
      typeScript,
      inputs: inputs.map((v) => v.cell),
      outputs: [
        sudtCell,
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
