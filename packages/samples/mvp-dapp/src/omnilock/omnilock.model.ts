import { CellPattern, JSONStore, OutPointString, SchemaPattern, UpdateStorageValue } from '@ckb-js/kuai-models'
import { Cell, HexString, Script } from '@ckb-lumos/base'
import { BI } from '@ckb-lumos/bi'
import { InternalServerError } from 'http-errors'
import { DAPP_DATA_PREFIX, TX_FEE } from '../const'

/**
 * add business logic in an actor
 */
export class OmnilockModel extends JSONStore<Record<string, never>> {
  constructor(
    _schemaOption?: void,
    params?: {
      states?: Record<OutPointString, never>
      chainData?: Record<OutPointString, UpdateStorageValue>
      cellPattern?: CellPattern
      schemaPattern?: SchemaPattern
    },
  ) {
    super(undefined, params)
  }

  claim(
    lock: Script,
    capacity: HexString,
  ): {
    inputs: Cell[]
    outputs: Cell[]
    witnesses: string[]
  } {
    const cells = Object.values(this.chainData).filter(
      (v) =>
        v.cell.cellOutput.lock.args === lock.args &&
        v.cell.cellOutput.lock.codeHash === lock.codeHash &&
        v.cell.cellOutput.lock.hashType === lock.hashType,
    )
    let currentTotalCapacity: BI = BI.from(0)
    // additional 0.001 ckb for tx fee
    const needCapacity = BI.from(capacity).add(TX_FEE)
    const inputs = cells.filter((v) => {
      if (currentTotalCapacity.gte(needCapacity)) return false
      currentTotalCapacity = currentTotalCapacity.add(BI.from(v.cell.cellOutput.capacity))
      return true
    })
    if (currentTotalCapacity.lt(needCapacity)) throw new InternalServerError('not enough capacity')
    return {
      inputs: inputs.map((v) => v.cell),
      outputs: [
        {
          cellOutput: {
            lock,
            capacity,
          },
          data: DAPP_DATA_PREFIX,
        },
        {
          cellOutput: {
            lock,
            capacity: currentTotalCapacity.sub(needCapacity).toHexString(),
          },
          data: '0x',
        },
      ],
      witnesses: inputs.map((v) => v.witness),
    }
  }
}
