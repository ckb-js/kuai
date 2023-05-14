import { readFileSync } from 'node:fs'
import { Hash, blockchain } from '@ckb-lumos/base'
import { generateDeployWithTypeIdTx } from '@ckb-lumos/common-scripts/lib/deploy'
import { sealTransaction } from '@ckb-lumos/helpers'
import { Indexer, commons, config, RPC, utils } from '@ckb-lumos/lumos'
import type { FromInfo } from '@ckb-lumos/common-scripts'

type Signature = string
export type MessageSigner = (message: string, fromInfo: FromInfo) => Promise<Signature>

export class ContractDeployer {
  #rpc: RPC
  #index: Indexer
  #signer: MessageSigner
  #network: {
    rpcUrl: string
    config: config.Config
  }

  constructor(
    signer: MessageSigner,
    network: {
      rpcUrl: string
      config: config.Config
    },
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
    txHash: Hash
    index: number
    dataHash: string
    typeId?: string
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
    const signatures = await Promise.all(
      txSkeleton.signingEntries.map(({ message }) => this.#signer(message, fromInfo)),
    )
    const signedTx = sealTransaction(txSkeleton, signatures)
    const txHash = await this.#rpc.sendTransaction(signedTx)

    return {
      txHash,
      index: parseInt(scriptConfig.INDEX),
      dataHash: scriptConfig.CODE_HASH,
      typeId: utils.ckbHash(blockchain.Script.pack(typeId)),
    }
  }
}
