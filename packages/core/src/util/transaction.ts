import { Transaction, commons, hd, helpers } from '@ckb-lumos/lumos'

export const sign = (txSkeleton: helpers.TransactionSkeletonType, privateKey: string): Transaction => {
  txSkeleton = commons.common.prepareSigningEntries(txSkeleton)
  const signature = hd.key.signRecoverable(txSkeleton.get('signingEntries').get(0)!.message, privateKey)
  return helpers.sealTransaction(txSkeleton, [signature])
}
