import { CellPattern, JSONStore, OutPointString, SchemaPattern, UpdateStorageValue } from '@ckb-js/kuai-models'
import { Cell, HexString } from '@ckb-lumos/base'
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
    if (!this.lockScript) {
      throw new Error('lock script is required')
    }
  }

  get meta(): Record<'capacity', string> {
    const cells = this.#filterCells()
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
    const cells = this.#filterCells()
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
            lock: this.lockScript!,
            capacity,
          },
          data: DAPP_DATA_PREFIX,
        },
        {
          cellOutput: {
            lock: this.lockScript!,
            capacity: currentTotalCapacity.sub(needCapacity).toHexString(),
          },
          data: '0x',
        },
      ],
      witnesses: [],
    }
  }

  #filterCells = () => {
    // TODO: is this filter necessary?
    return Object.values(this.chainData).filter((v) => this.cellPattern?.(v) ?? true)
  }
}
