import {
  ActorProvider,
  Param,
  ActorReference,
  CellPattern,
  JSONStore,
  OutPointString,
  ProviderKey,
  SchemaPattern,
  UpdateStorageValue,
} from '@ckb-js/kuai-models'
import { Cell, HexString } from '@ckb-lumos/base'
import { BI } from '@ckb-lumos/bi'
import { InternalServerError } from 'http-errors'
import { DAPP_DATA_PREFIX, INITIAL_RECORD_STATE, TX_FEE } from '../const'
import { config } from '@ckb-lumos/lumos'
import { createScriptRegistry } from '@ckb-lumos/experiment-tx-assembler'

/**
 * add business logic in an actor
 */
@ActorProvider({ name: 'omnilock', path: `/:args/` })
export class OmnilockModel extends JSONStore<Record<string, never>> {
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
    const ref = new ActorReference('omnilock', `/${args}/`)
    Reflect.defineMetadata(
      ProviderKey.LockPattern,
      createScriptRegistry(config.getConfig().SCRIPTS).newScript('OMNILOCK', args),
      OmnilockModel,
      ref.uri,
    )
    super(undefined, { ...params, ref })
    if (!this.lockScript) {
      throw new Error('lock script is required')
    }
    this.cellPattern = (value: UpdateStorageValue) => {
      const cellLock = value.cell.cellOutput.lock
      return (
        cellLock.args === this.lockScript?.args &&
        cellLock.codeHash === this.lockScript?.codeHash &&
        cellLock.hashType === this.lockScript?.hashType &&
        value.cell.data === '0x'
      )
    }
    this.registerResourceBinding()
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
    return {
      inputs: inputs.map((v) => v.cell),
      outputs: [
        {
          cellOutput: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            lock: this.lockScript!,
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
