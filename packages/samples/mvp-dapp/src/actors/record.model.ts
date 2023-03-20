import {
  ActorProvider,
  ActorReference,
  CellPattern,
  JSONStore,
  OutPointString,
  SchemaPattern,
  UpdateStorageValue,
} from '@ckb-js/kuai-models'
import { Cell } from '@ckb-lumos/base'
import { InternalServerError } from 'http-errors'
import { BI } from '@ckb-lumos/bi'
import { DAPP_DATA_PREFIX, DAPP_DATA_PREFIX_LEN, TX_FEE } from '../const'
import { inject } from 'inversify'

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
@ActorProvider({ name: 'record', path: '/:lockHash/' })
export class RecordModel extends JSONStore<{ data: { offset: number; schema: StoreType['data'] } }> {
  constructor(
    @inject('lockHash') lockHash: string,
    _schemaOption?: { data: { offset: number } },
    params?: {
      states?: Record<OutPointString, StoreType>
      chainData?: Record<OutPointString, UpdateStorageValue>
      cellPattern?: CellPattern
      schemaPattern?: SchemaPattern
    },
  ) {
    const ref = new ActorReference('record', `/${lockHash}`)
    super(ref, { data: { offset: (DAPP_DATA_PREFIX_LEN - 2) / 2 } }, params)

    this.cellPattern = (value: UpdateStorageValue) => {
      const cellLock = value.cell.cellOutput.lock
      return (
        cellLock.args === this.lockScript?.args &&
        cellLock.codeHash === this.lockScript?.codeHash &&
        cellLock.hashType === this.lockScript?.hashType &&
        value.cell.data.startsWith(DAPP_DATA_PREFIX)
      )
    }

    this.registerResourceBinding()
  }

  update(newValue: StoreType['data']) {
    const inputs = Object.values(this.chainData)
    if (!inputs.length) throw new InternalServerError('No mvp cell to set value')
    const { data } = this.initOnChain({ data: newValue })
    const outputCapacity = inputs
      .reduce((pre: BI, cur) => pre.add(cur.cell.cellOutput.capacity), BI.from(0))
      .sub(TX_FEE)
    if (outputCapacity.lt('6100000000')) throw new Error('not enough capacity')
    const outputs: Cell[] = [
      {
        cellOutput: {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          ...inputs[0]!.cell.cellOutput,
          capacity: outputCapacity.toHexString(),
        },
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        data: `${inputs[0]!.cell.data.slice(0, 2 + this.schemaOption!.data.offset * 2)}${data.slice(
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          2 + this.schemaOption!.data.offset * 2,
        )}`,
      },
    ]
    return {
      inputs: inputs.map((v) => v.cell),
      outputs: outputs,
    }
  }

  clear(): {
    inputs: Cell[]
    outputs: Cell[]
    witnesses: string[]
  } {
    const inputs = Object.values(this.chainData)
    if (!inputs.length) throw new InternalServerError('No mvp cell to set value')
    let hasSubFee = false
    const outputs: Cell[] = inputs.map((v) => {
      if (!hasSubFee && BI.from(v.cell.cellOutput.capacity).gte(BI.from('6100000000').add(TX_FEE))) {
        hasSubFee = true
        return {
          ...v.cell,
          cellOutput: {
            ...v.cell.cellOutput,
            capacity: BI.from(v.cell.cellOutput.capacity).sub(TX_FEE).toHexString(),
          },
          data: '0x',
        }
      }
      return {
        ...v.cell,
        data: '0x',
      }
    })
    return {
      inputs: inputs.map((v) => v.cell),
      outputs: outputs,
      witnesses: [],
    }
  }

  getOneOfKey() {
    const oneKey = Object.keys(this.chainData)
    return oneKey[0]
  }
}
