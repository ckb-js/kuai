import { TransactionSkeletonObject } from '@ckb-lumos/helpers'

export interface TransferRequest {
  from: string[]
  to: string
  amount: bigint
  typeId: string
}

export interface TransferResponse {
  skeleton: TransactionSkeletonObject
}
