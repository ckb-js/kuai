import { readFileSync } from 'node:fs'
import { Hash, Transaction, blockchain, HashType, DepType } from '@ckb-lumos/base'
import { generateDeployWithTypeIdTx, generateUpgradeTypeIdDataTx } from '@ckb-lumos/common-scripts/lib/deploy'
import { sealTransaction, createTransactionFromSkeleton, scriptToAddress } from '@ckb-lumos/helpers'
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
    this.#rpc = new RPC(network.rpcUrl, {
      fetch: (request, init) => globalThis.fetch(request, { ...init, keepalive: true }),
    })
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
    hashType: HashType
    depType: DepType
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
        const signatures: string[] = []
        for (const { message, index } of txSkeleton.signingEntries) {
          const signer = scriptToAddress(txSkeleton.inputs.get(index)!.cellOutput.lock, {
            config: this.#network.config,
          })
          signatures.push(await signerProvider(message, signer))
        }

        return sealTransaction(txSkeleton, signatures)
      }

      return createTransactionFromSkeleton(txSkeleton)
    })()

    return {
      tx,
      index: parseInt(scriptConfig.INDEX),
      hashType: scriptConfig.HASH_TYPE,
      depType: scriptConfig.DEP_TYPE,
      dataHash: scriptConfig.CODE_HASH,
      typeId: utils.ckbHash(blockchain.Script.pack(typeId)),
      send: () => this.#rpc.sendTransaction(tx),
    }
  }

  async upgrade(
    contractBinPath: string,
    deployer: FromInfo,
    feePayer: FromInfo,
    contract: {
      txHash: Hash
      index: number
      dataHash: Hash
    },
    options?: {
      feeRate?: number
    },
  ): Promise<{
    tx: Transaction
    index: number
    dataHash: string
    hashType: HashType
    depType: DepType
    typeId?: string
    send: () => Promise<Hash>
  }> {
    const { feeRate = 1000 } = options || {}
    const contractBin = readFileSync(contractBinPath)

    const contractTx = await this.#rpc.getTransaction(contract.txHash)
    const typeIdScript = contractTx.transaction.outputs[contract.index].type!

    const result = await generateUpgradeTypeIdDataTx({
      cellProvider: this.#index,
      typeId: typeIdScript,
      fromInfo: deployer,
      scriptBinary: contractBin,
      config: this.#network.config,
    })

    let { txSkeleton } = result
    const { scriptConfig } = result

    txSkeleton = await commons.common.payFee(txSkeleton, [feePayer], feeRate, undefined, {
      config: this.#network.config,
    })
    txSkeleton = commons.common.prepareSigningEntries(txSkeleton)

    const tx = await (async () => {
      if (this.#signer) {
        const signerProvider = this.#signer
        const signatures: string[] = []
        for (const { message, index } of txSkeleton.signingEntries) {
          const signer = scriptToAddress(txSkeleton.inputs.get(index)!.cellOutput.lock, {
            config: this.#network.config,
          })
          signatures.push(await signerProvider(message, signer))
        }

        return sealTransaction(txSkeleton, signatures)
      }

      return createTransactionFromSkeleton(txSkeleton)
    })()

    return {
      tx,
      index: parseInt(scriptConfig.INDEX),
      dataHash: scriptConfig.CODE_HASH,
      hashType: scriptConfig.HASH_TYPE,
      depType: scriptConfig.DEP_TYPE,
      typeId: utils.ckbHash(blockchain.Script.pack(typeIdScript)),
      send: () => this.#rpc.sendTransaction(tx),
    }
  }
}
