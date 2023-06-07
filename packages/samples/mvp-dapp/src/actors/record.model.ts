/**
 * @module src/actors/record.model
 * @description
 * This is the actor model for record, which is used to store data in a json format.
 */

import {
  ActorProvider,
  Lock,
  Param,
  ActorReference,
  CellPattern,
  JSONStore,
  OutPointString,
  SchemaPattern,
  UpdateStorageValue,
  DataPrefixPattern,
  LockPattern,
  TypePattern,
  Type,
} from '@ckb-js/kuai-models'
import type { Cell, CellDep } from '@ckb-lumos/base'
import { InternalServerError } from 'http-errors'
import { BI } from '@ckb-lumos/bi'
import {
  DAPP_DATA_PREFIX,
  DAPP_DATA_PREFIX_LEN,
  MVP_CONTRACT_CELL_DEP,
  MVP_CONTRACT_TYPE_SCRIPT,
  TX_FEE,
} from '../const'

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
@ActorProvider({ ref: { name: 'record', path: '/:codeHash/:hashType/:args/' } })
@LockPattern()
@TypePattern()
@DataPrefixPattern(DAPP_DATA_PREFIX)
@Lock()
@Type(MVP_CONTRACT_TYPE_SCRIPT)
export class RecordModel extends JSONStore<{ data: { offset: number; schema: StoreType['data'] } }> {
  constructor(
    @Param('codeHash') codeHash: string,
    @Param('hashType') hashType: string,
    @Param('args') args: string,
    _schemaOption?: { data: { offset: number } },
    params?: {
      states?: Record<OutPointString, StoreType>
      chainData?: Record<OutPointString, UpdateStorageValue>
      cellPattern?: CellPattern
      schemaPattern?: SchemaPattern
    },
  ) {
    super(
      { data: { offset: (DAPP_DATA_PREFIX_LEN - 2) / 2 } },
      {
        ...params,
        ref: ActorReference.newWithPattern(RecordModel, `/${codeHash}/${hashType}/${args}/`),
      },
    )

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
      cellDeps: [MVP_CONTRACT_CELL_DEP],
    }
  }

  clear(): {
    inputs: Cell[]
    outputs: Cell[]
    witnesses: string[]
    cellDeps?: CellDep[]
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
            type: undefined,
          },
        }
      }
      return {
        ...v.cell,
        cellOutput: {
          ...v.cell.cellOutput,
          type: undefined,
        },
      }
    })
    return {
      inputs: inputs.map((v) => v.cell),
      cellDeps: [MVP_CONTRACT_CELL_DEP],
      outputs: outputs,
      witnesses: [],
    }
  }

  getOneOfKey() {
    const oneKey = Object.keys(this.chainData)
    return oneKey[0]
  }
}
