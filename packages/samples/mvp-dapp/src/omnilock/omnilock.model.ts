import { CellPattern, JSONStore, OutPointString, SchemaPattern, UpdateStorageValue } from '@ckb-js/kuai-models'
import { HexString, Script } from '@ckb-lumos/base'
import { BI } from '@ckb-lumos/bi'
import { DAPP_DATA_PREFIX } from '../const'

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

  claim(lock: Script, capacity: HexString) {
    const cells = Object.values(this.chainData).filter(
      (v) =>
        v.cell.cellOutput.lock.args === lock.args &&
        v.cell.cellOutput.lock.codeHash === lock.codeHash &&
        v.cell.cellOutput.lock.hashType === lock.hashType,
    )
    const totalCapacity: BI = BI.from(0)
    const currentTotalCapacity: BI = BI.from(0)
    const inputs = cells.filter((v) => {
      totalCapacity.add(BI.from(v.cell.cellOutput.capacity))
      if (currentTotalCapacity.gte(capacity)) return false
      currentTotalCapacity.add(BI.from(v.cell.cellOutput.capacity))
      return true
    })
    if (currentTotalCapacity.lt(capacity)) throw new Error('not enough capacity')
    return {
      inputs: inputs.map((v) => v.cell.cellOutput),
      outputs: [
        {
          lock,
          capacity,
        },
        {
          lock,
          capacity: totalCapacity.sub(capacity).toHexString(),
        },
      ],
      outputs_data: [`0x${DAPP_DATA_PREFIX}`, '0x'],
    }
  }
}
