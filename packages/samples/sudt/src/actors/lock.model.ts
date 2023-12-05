import { ActorReference, JSONStore, UpdateStorageValue } from '@ckb-js/kuai-models'
import { BI, Cell, Script } from '@ckb-lumos/lumos'
import { getConfig } from '@ckb-lumos/config-manager'
import { BadRequest } from 'http-errors'
import { appRegistry } from '.'
import { getLock } from '../utils'

export abstract class LockModel extends JSONStore<Record<string, never>> {
  static getLock = (address: string): LockModel => {
    const lock = getLock(address)
    if (lock.codeHash === getConfig().SCRIPTS.ANYONE_CAN_PAY?.CODE_HASH) {
      return appRegistry.findOrBind<LockModel>(new ActorReference('acp', `/${lock.args}/`))
    } else if (lock.codeHash === getConfig().SCRIPTS.OMNILOCK?.CODE_HASH) {
      return appRegistry.findOrBind<LockModel>(new ActorReference('omnilock', `/${lock.args}/`))
    } else {
      throw new BadRequest('not support address')
    }
  }
  abstract meta: Record<'capacity', string>
  abstract loadCapacity: (capacity: BI) => { inputs: UpdateStorageValue[]; currentTotalCapacity: BI }
  abstract mint: (
    lockScript: Script,
    amount: BI,
    args?: string,
  ) => { inputs: Cell[]; outputs: Cell[]; witnesses: string[]; typeScript: Script }
}
