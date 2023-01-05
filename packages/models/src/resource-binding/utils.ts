import { OutPointString } from '../store'
import { OutPoint } from '@ckb-lumos/base'

export function outpointToOutPointString(outpoint: OutPoint): OutPointString {
  return `${outpoint.txHash}${outpoint.index.substring(2, outpoint.index.length)}`
}
