import { TransactionSkeletonType } from '@ckb-lumos/helpers'
import { HexString } from '@ckb-lumos/lumos'

export interface MintRequest {
  from: string[]
  to: string
  amount: HexString
}

export interface MintResponse {
  txSkeleton: TransactionSkeletonType
}
