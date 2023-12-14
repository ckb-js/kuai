import { TransactionSkeletonType } from '@ckb-lumos/helpers'
import { HexString } from '@ckb-lumos/lumos'

export interface TransferRequest {
  from: string[]
  to: string
  amount: HexString
}

export interface MintRequest extends Omit<TransferRequest, 'from'> {}

export interface MintResponse {
  txSkeleton: TransactionSkeletonType
}
