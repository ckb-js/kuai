/**
 * @module src/actors/omnilock.model
 * @description
 * This is the actor model for omnilock, which is used to gather omnilock cells to generate record models.
 */

import {
  ActorProvider,
  Param,
  ActorReference,
  CellPattern,
  JSONStore,
  OutPointString,
  SchemaPattern,
  UpdateStorageValue,
  TypeFilter,
  Sudt,
} from '@ckb-js/kuai-models'
import type { Cell, HexString, Script } from '@ckb-lumos/base'
import { number, bytes } from '@ckb-lumos/codec'
import { InternalServerError } from 'http-errors'
import { BI, utils, config } from '@ckb-lumos/lumos'
import { MIN_SUDT_WITH_OMINILOCK, TX_FEE } from '../const'

/**
 * add business logic in an actor
 */
@ActorProvider({ ref: { name: 'sudt', path: `/:args/` } })
@TypeFilter()
@Sudt()
export class SudtModel extends JSONStore<Record<string, never>> {
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
    super(undefined, { ...params, ref: ActorReference.newWithFilter(SudtModel, `/${args}/`) })
    if (!this.typeScript) {
      throw new Error('type script is required')
    }
    this.registerResourceBinding()
  }

  getSudtBalance(lockScripts: Script[]): Record<'capacity' | 'sudtBalance', string> {
    let capacity = BigInt(0)
    let sudtBalance = BigInt(0)
    const filterScriptHashes = new Set(lockScripts.map((v) => utils.computeScriptHash(v)))
    Object.values(this.chainData).forEach((v) => {
      if (filterScriptHashes.has(utils.computeScriptHash(v.cell.cellOutput.lock))) {
        capacity += BigInt(v.cell.cellOutput.capacity ?? 0)
        sudtBalance += number.Uint128LE.unpack(v.cell.data.slice(0, 34)).toBigInt()
      }
    })
    return {
      capacity: capacity.toString(),
      sudtBalance: sudtBalance.toString(),
    }
  }

  send(from: Script[], lockScript: Script, amount: HexString) {
    const CONFIG = config.getConfig()
    const sudtCell: Cell = {
      cellOutput: {
        capacity: BI.from(MIN_SUDT_WITH_OMINILOCK).toHexString(),
        lock: lockScript,
        type: {
          codeHash: CONFIG.SCRIPTS.SUDT!.CODE_HASH,
          hashType: CONFIG.SCRIPTS.SUDT!.HASH_TYPE,
          args: utils.computeScriptHash(lockScript),
        },
      },
      data: bytes.hexify(number.Uint128LE.pack(amount)),
    }
    const cells = Object.values(this.chainData)
    let currentTotalSudt: BI = BI.from(0)
    let currentTotalCapacity: BI = BI.from(0)
    // additional 0.001 ckb for tx fee
    const needCapacity = BI.from(sudtCell.cellOutput.capacity).add(TX_FEE)
    const fromScriptHashes = new Set(from.map((v) => utils.computeScriptHash(v)))
    const inputs = cells.filter((v) => {
      if (!fromScriptHashes.has(utils.computeScriptHash(v.cell.cellOutput.lock))) return false
      if (currentTotalCapacity.gte(needCapacity) && currentTotalSudt.gte(amount)) return false
      currentTotalCapacity = currentTotalCapacity.add(BI.from(v.cell.cellOutput.capacity))
      currentTotalSudt = currentTotalSudt.add(number.Uint128LE.unpack(v.cell.data.slice(0, 34)))
      return true
    })
    if (currentTotalCapacity.lt(needCapacity)) throw new InternalServerError('not enough capacity')
    if (currentTotalSudt.lt(amount)) throw new InternalServerError('not enough sudt balance')

    const leftSudt = currentTotalSudt.sub(amount)
    const hasLeftSudt = leftSudt.gt(0)
    return {
      inputs: inputs.map((v) => v.cell),
      outputs: [
        sudtCell,
        {
          cellOutput: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            lock: this.lockScript!,
            capacity: currentTotalCapacity.sub(needCapacity).toHexString(),
            type: hasLeftSudt ? this.typeScript : undefined,
          },
          data: hasLeftSudt ? bytes.hexify(number.Uint128LE.pack(leftSudt)) : '0x',
        },
      ],
      witnesses: [],
    }
  }

  destory(from: Script[], amount?: HexString) {
    const fromScriptHashes = new Set(from.map((v) => utils.computeScriptHash(v)))
    const cells = Object.values(this.chainData).filter((v) =>
      fromScriptHashes.has(utils.computeScriptHash(v.cell.cellOutput.lock)),
    )
    if (!cells.length) throw new InternalServerError('There is no sudt cell')
    let useInputs = cells
    let currentTotalSudt: BI = BI.from(0)
    let totalCapacity: BI = BI.from(0)
    if (amount) {
      useInputs = cells.filter((v) => {
        if (currentTotalSudt.gte(amount)) return false
        totalCapacity = totalCapacity.add(BI.from(v.cell.cellOutput.capacity))
        currentTotalSudt = currentTotalSudt.add(number.Uint128LE.unpack(v.cell.data.slice(0, 34)))
        return true
      })
      if (currentTotalSudt.lt(amount)) throw new InternalServerError('not enough sudt balance')
    }

    const leftSudt = currentTotalSudt.sub(amount ?? 0)
    const hasLeftSudt = leftSudt.gt(0)
    return {
      inputs: useInputs.map((v) => v.cell),
      outputs: [
        {
          cellOutput: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            lock: this.lockScript!,
            capacity: totalCapacity.sub(TX_FEE).toHexString(),
            type: hasLeftSudt ? this.typeScript : undefined,
          },
          data: hasLeftSudt ? bytes.hexify(number.Uint128LE.pack(leftSudt)) : '0x',
        },
      ],
      witnesses: [],
    }
  }

  meta() {
    return {
      // will get from explorer or db
      name: 'sudt',
      symbol: 'symbol',
    }
  }
}
