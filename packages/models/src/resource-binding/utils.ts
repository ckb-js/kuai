import { OutPointString } from '../store'
import { OutPoint } from '@ckb-lumos/base'
import { BI } from '@ckb-lumos/bi'

export function outpointToOutPointString(outpoint: OutPoint): OutPointString {
  return `${outpoint.txHash}${BI.from(outpoint.index).toHexString().substring(2)}`
}
