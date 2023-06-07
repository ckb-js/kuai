import { readFileSync } from 'node:fs'
import { Hash, Transaction, blockchain } from '@ckb-lumos/base'
import { generateDeployWithTypeIdTx } from '@ckb-lumos/common-scripts/lib/deploy'
import { sealTransaction, createTransactionFromSkeleton } from '@ckb-lumos/helpers'
import { Indexer, commons, config, RPC, utils } from '@ckb-lumos/lumos'
import type { FromInfo } from '@ckb-lumos/common-scripts'

type Signature = string
export type MessageSigner = (message: string, fromInfo: FromInfo) => Promise<Signature>

export class ContractDeployer {
  #rpc: RPC
  #index: Indexer
  #signer?: MessageSigner
  #network: {
    rpcUrl: string
    config: config.Config
  }

  constructor(
    network: {
      rpcUrl: string
      config: config.Config
    },
    signer?: MessageSigner,
  ) {
    this.#signer = signer
    this.#rpc = new RPC(network.rpcUrl)
    this.#index = new Indexer(network.rpcUrl)
    this.#network = network
  }

  async deploy(
    contractBinPath: string,
    fromInfo: FromInfo,
    options?: {
      feeRate?: number
      enableTypeId?: boolean
    },
  ): Promise<{
    tx: Transaction
    index: number
    dataHash: string
    typeId?: string
    send: () => Promise<Hash>
  }> {
    const { feeRate = 1000 } = options || {}
    const contractBin = readFileSync(contractBinPath)

    const result = await generateDeployWithTypeIdTx({
      cellProvider: this.#index,
      fromInfo,
      scriptBinary: contractBin,
      config: this.#network.config,
    })

    let { txSkeleton } = result
    const { scriptConfig, typeId } = result

    txSkeleton = await commons.common.payFee(txSkeleton, [fromInfo], feeRate, undefined, {
      config: this.#network.config,
    })
    txSkeleton = commons.common.prepareSigningEntries(txSkeleton)

    const tx = await (async () => {
      if (this.#signer) {
        const signerProvider = this.#signer
        const signatures = await Promise.all(
          txSkeleton.signingEntries.map(({ message }) => signerProvider(message, fromInfo)),
        )

        return sealTransaction(txSkeleton, signatures)
      }

      return createTransactionFromSkeleton(txSkeleton)
    })()

    return {
      tx,
      index: parseInt(scriptConfig.INDEX),
      dataHash: scriptConfig.CODE_HASH,
      typeId: utils.ckbHash(blockchain.Script.pack(typeId)),
      send: () => this.#rpc.sendTransaction(tx),
    }
  }
}
