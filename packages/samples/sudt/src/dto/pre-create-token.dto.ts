import { HexString } from '@ckb-lumos/lumos'
import { TransactionSkeletonType } from '@ckb-lumos/helpers'

export interface PreCreateTokenRequest {
  from: string
  to: string
  amount: HexString
}

export interface PreCreateTokenResponse {
  txSkeleton: TransactionSkeletonType
}
