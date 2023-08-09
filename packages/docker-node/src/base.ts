import { CKBNode } from './interface'
import { Address, CellDep, DepType, Indexer, RPC, Transaction, commons, config, hd, helpers } from '@ckb-lumos/lumos'
import type { DeployOptions } from './types'
import fs from 'node:fs'
import { ContractManager, ContractDeploymentInfo, waitUntilCommitted } from '@ckb-js/kuai-common'
import path from 'node:path'

export abstract class CKBNodeBase implements CKBNode {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract start(params: any): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  abstract stop(params: any): void

  abstract get url(): string
  abstract get port(): string
  abstract get host(): string
  abstract get lumosConfig(): config.Config

  protected abstract set lumosConfig(config: config.Config)

  protected async doDeploy(
    rpc: RPC,
    indexer: Indexer,
    from: Address,
    privateKey: string,
    script: string,
    filePath: string,
    cellDeps?: { name: string; cellDep: CellDep }[],
    depType: DepType = 'code',
  ): Promise<ContractDeploymentInfo> {
    const scriptBinary = fs.readFileSync(filePath)
    let txSkeleton = (
      await commons.deploy.generateDeployWithDataTx({
        cellProvider: indexer,
        scriptBinary,
        fromInfo: from,
      })
    ).txSkeleton
    cellDeps?.forEach((dep) => {
      txSkeleton = txSkeleton.update('cellDeps', (cellDeps) => cellDeps.push(dep.cellDep))
    })
    const txHash = await rpc.sendTransaction(this.sign(txSkeleton, privateKey))

    try {
      await waitUntilCommitted(rpc, txHash)
    } catch (e) {
      console.error(e)
    }

    return {
      name: script,
      path: filePath,
      depType,
      cellDeps,
      outPoint: {
        txHash,
        index: '0x0',
      },
      scriptBase: {
        codeHash: '',
        hashType: 'type',
      },
    }
  }

  protected async deployBuiltInScripts(
    contractManager: ContractManager,
    scriptName: string[],
    builtInDirPath: string,
    indexer: Indexer,
    rpc: RPC,
    from: Address,
    privateKey: string,
  ): Promise<void> {
    for (const script of scriptName) {
      const filePath = path.join(builtInDirPath, script)
      contractManager.updateContract(await this.doDeploy(rpc, indexer, from, privateKey, script, filePath))
    }
  }

  private sign(txSkeleton: helpers.TransactionSkeletonType, privateKey: string): Transaction {
    txSkeleton = commons.common.prepareSigningEntries(txSkeleton)
    const signature = hd.key.signRecoverable(txSkeleton.get('signingEntries').get(0)!.message, privateKey)
    return helpers.sealTransaction(txSkeleton, [signature])
  }

  protected async deployCustomScripts(
    contractManager: ContractManager,
    indexer: Indexer,
    rpc: RPC,
    from: Address,
    privateKey: string,
  ): Promise<void> {
    for (const script of contractManager.contracts) {
      const deployedScript = await this.doDeploy(
        rpc,
        indexer,
        from,
        privateKey,
        script.name,
        script.path,
        script.cellDeps
          ? contractManager.contracts
              .filter((v) => script.cellDeps?.map((v) => v.name).includes(v.name))
              .map((v) => {
                return { name: v.name, cellDep: { depType: v.depType, outPoint: v.outPoint } }
              })
          : undefined,
        script.depType,
      )
      contractManager.updateContract(deployedScript)
    }
  }

  async deployScripts({
    builtInScriptName,
    contractManager,
    builtInDirPath,
    indexer,
    rpc,
    privateKey,
  }: DeployOptions): Promise<void> {
    const from = helpers.encodeToConfigAddress(hd.key.privateKeyToBlake160(privateKey), 'SECP256K1_BLAKE160')
    await indexer.waitForSync()
    await this.deployBuiltInScripts(contractManager, builtInScriptName, builtInDirPath, indexer, rpc, from, privateKey)
    await this.deployCustomScripts(contractManager, indexer, rpc, from, privateKey)
    contractManager.write()
  }

  async generateLumosConfig(): Promise<void> {
    const rpc = new RPC(this.url)
    const block = await rpc.getBlockByNumber('0x0')
    this.lumosConfig = {
      PREFIX: 'ckt',
      SCRIPTS: {
        SECP256K1_BLAKE160: {
          CODE_HASH: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
          HASH_TYPE: 'type',
          TX_HASH: block.transactions[1].hash!,
          INDEX: '0x0',
          DEP_TYPE: 'depGroup',
          SHORT_ID: 0,
        },
        SECP256K1_BLAKE160_MULTISIG: {
          CODE_HASH: '0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8',
          HASH_TYPE: 'type',
          TX_HASH: block.transactions[1].hash!,
          INDEX: '0x1',
          DEP_TYPE: 'depGroup',
          SHORT_ID: 1,
        },
      },
    }
  }
}
