import { CellPattern, JSONStore, OutPointString, SchemaPattern, UpdateStorageValue } from '@ckb-js/kuai-models'
import { DAPP_DATA_PREFIX_LEN } from '../const'

export type ItemData = {
  key: string
  value: string
  label: string
}

export type StoreType = {
  data: {
    profile?: ItemData[]
    addresses?: ItemData[]
    custom?: ItemData[]
    dweb?: ItemData[]
  }
}

/**
 * add business logic in an actor
 */

export class RecordModel extends JSONStore<{ data: { offset: number; schema: StoreType['data'] } }> {
  constructor(
    _schemaOption?: { data: { offset: number } },
    params?: {
      states?: Record<OutPointString, StoreType>
      chainData?: Record<OutPointString, UpdateStorageValue>
      cellPattern?: CellPattern
      schemaPattern?: SchemaPattern
    },
  ) {
    super({ data: { offset: DAPP_DATA_PREFIX_LEN } }, params)
  }

  update(newValue: StoreType['data']) {
    const input = Object.values(this.chainData)[0]
    if (!input) throw new Error('No mvp cell to set value')
    const { data } = this.initOnChain({ data: newValue })
    return {
      inputs: input.cell.cellOutput,
      outputs: input.cell.cellOutput,
      outputs_data: [data],
    }
  }

  clear() {
    const input = Object.values(this.chainData)[0]
    if (!input) throw new Error('No mvp cell to set value')
    return {
      inputs: input.cell.cellOutput,
      outputs: input.cell.cellOutput,
      outputs_data: ['0x0'],
    }
  }

  getOneOfKey() {
    const oneKey = Object.keys(this.chainData)
    return oneKey[0]
  }
}
