import { OutPointString } from '../store'
import { OutPoint } from '@ckb-lumos/base'

export function outPointToOutPointString(outpoint: OutPoint): OutPointString {
  return `${outpoint.txHash}-${outpoint.index}`
}
