import { Address, CellDep, Indexer, RPC, Transaction, commons, config, hd, helpers } from '@ckb-lumos/lumos'
import { CKBNode } from './interface'
import type { BinNodeStartOptions, BinNodeStopOptions, DeployOptions, InfraScript } from './types'
import { spawn, execSync } from 'child_process'
import { generateDevConfig } from './helper'
import fs from 'fs'
import path from 'node:path'
import { waitUntilCommitted } from '@ckb-js/kuai-common'

export class CKBBinNetwork implements CKBNode {
  #port = '8114'
  #host = '127.0.0.1'
  #lumosConfig: config.Config = config.getConfig()

  stop({ ckbPath, clear }: BinNodeStopOptions): void {
    if (fs.existsSync(path.resolve(ckbPath, 'pid'))) {
      const indexer = fs.readFileSync(path.resolve(ckbPath, 'pid', 'indexer'), 'utf-8')
      spawn('kill', ['-15', indexer])
      const miner = fs.readFileSync(path.resolve(ckbPath, 'pid', 'miner'), 'utf-8')
      spawn('kill', ['-15', miner])
    }

    if (clear) {
      fs.rmSync(path.resolve(ckbPath, 'ckb-miner.toml'))
      fs.rmSync(path.resolve(ckbPath, 'ckb.toml'))
      fs.rmSync(path.resolve(ckbPath, 'data'), { recursive: true, force: true })
      fs.rmSync(path.resolve(ckbPath, 'default.db-options'))
      fs.rmSync(path.resolve(ckbPath, 'specs'), { recursive: true, force: true })
      fs.rmSync(path.resolve(ckbPath, 'pid'), { recursive: true, force: true })
      fs.rmSync(path.resolve(ckbPath, 'dev.toml'))
    }
  }

  #initConfig(ckbPath: string, genesisAccountArgs?: string[]) {
    const devConfig = generateDevConfig(genesisAccountArgs)
    fs.writeFileSync(path.resolve(ckbPath, 'dev.toml'), devConfig, { flag: 'w' })

    if (!fs.existsSync(path.resolve(ckbPath, 'ckb.toml'))) {
      const out = execSync(
        `${path.resolve(ckbPath, 'ckb')} init -C ${ckbPath} --chain dev --import-spec ${path.resolve(
          ckbPath,
          'dev.toml',
        )} --ba-arg 0x839f6f4d6fdf773d3e015f8b19fe5c4ccb07723d --ba-code-hash 0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8 --ba-hash-type type --ba-message 0x1234`,
      )

      console.info(out.toString())

      fs.copyFileSync(path.resolve(__dirname, '../ckb/ckb-miner.toml'), path.join(ckbPath, 'ckb-miner.toml'))
    }

    if (!fs.existsSync(path.join(ckbPath, 'pid'))) {
      fs.mkdirSync(path.join(ckbPath, 'pid'))
    }
  }

  async #startIndexer(ckbPath: string, detached: boolean) {
    const indexer = spawn(path.resolve(ckbPath, 'ckb'), ['run', '-C', ckbPath, '--indexer'], {
      detached,
    })
    if (indexer.pid) {
      fs.writeFileSync(path.resolve(ckbPath, 'pid', 'indexer'), indexer.pid.toString(), {
        flag: 'w',
        encoding: 'utf-8',
      })
    }
    indexer.stdout?.on('data', (data) => {
      console.info(data.toString())
    })
    indexer.stderr?.on('data', (data) => {
      console.info(data.toString())
    })

    indexer.unref()
  }

  async #startMiner(ckbPath: string, detached: boolean) {
    const miner = spawn(path.resolve(ckbPath, 'ckb'), ['miner', '-C', ckbPath], {
      detached,
    })
    if (miner.pid) {
      fs.writeFileSync(path.resolve(ckbPath, 'pid', 'miner'), miner.pid.toString(), {
        flag: 'w',
        encoding: 'utf-8',
      })
    }
    miner.stdout?.on('data', (data) => {
      console.info(data.toString())
    })
    miner.stderr?.on('data', (data) => {
      console.info(data.toString())
    })
    miner.unref()
  }

  start({ detached = true, ckbPath, genesisAccountArgs, port }: BinNodeStartOptions): void {
    this.#port = port
    this.#initConfig(ckbPath, genesisAccountArgs)
    this.#startIndexer(ckbPath, detached)
    this.#startMiner(ckbPath, detached)
  }

  private async doDeploy(
    rpc: RPC,
    indexer: Indexer,
    from: Address,
    privateKey: string,
    script: string,
    filePath: string,
    cellDeps?: { name: string; cellDep: CellDep }[],
  ): Promise<InfraScript> {
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
      depType: 'code',
      cellDeps,
      outPoint: {
        txHash,
        index: '0x0',
      },
    }
  }

  private async deployBuiltInScripts(
    scriptName: string[],
    builtInDirPath: string,
    indexer: Indexer,
    rpc: RPC,
    from: Address,
    privateKey: string,
  ): Promise<InfraScript[]> {
    const scripts: InfraScript[] = []
    for (const script of scriptName) {
      const filePath = path.join(builtInDirPath, script)
      scripts.push(await this.doDeploy(rpc, indexer, from, privateKey, script, filePath))
    }

    return scripts
  }

  private sign(txSkeleton: helpers.TransactionSkeletonType, privateKey: string): Transaction {
    txSkeleton = commons.common.prepareSigningEntries(txSkeleton)
    const signature = hd.key.signRecoverable(txSkeleton.get('signingEntries').get(0)!.message, privateKey)
    return helpers.sealTransaction(txSkeleton, [signature])
  }

  private async deployCustomScripts(
    filePath: string,
    indexer: Indexer,
    rpc: RPC,
    from: Address,
    privateKey: string,
  ): Promise<InfraScript[]> {
    const scripts: InfraScript[] = []
    if (fs.existsSync(filePath)) {
      const configs = JSON.parse(fs.readFileSync(filePath).toString()) as { custom: InfraScript[] }
      if (configs.custom && Array.isArray(configs.custom)) {
        for (const script of configs.custom) {
          const deployedScript = await this.doDeploy(
            rpc,
            indexer,
            from,
            privateKey,
            script.name,
            script.path,
            script.cellDeps
              ? scripts
                  .filter((v) => script.cellDeps?.map((v) => v.name).includes(v.name))
                  .map((v) => {
                    return { name: v.name, cellDep: { depType: v.depType, outPoint: v.outPoint } }
                  })
              : undefined,
          )
          scripts.push(deployedScript)
        }
      }
    }

    return scripts
  }

  public async deployScripts({
    builtInScriptName,
    configFilePath,
    builtInDirPath,
    indexer,
    rpc,
    privateKey,
  }: DeployOptions): Promise<void> {
    const from = helpers.encodeToConfigAddress(hd.key.privateKeyToBlake160(privateKey), 'SECP256K1_BLAKE160')
    await indexer.waitForSync()
    const config = {
      builtIn: await this.deployBuiltInScripts(builtInScriptName, builtInDirPath, indexer, rpc, from, privateKey),
      custom: await this.deployCustomScripts(configFilePath, indexer, rpc, from, privateKey),
    }

    fs.writeFileSync(configFilePath, Buffer.from(JSON.stringify(config)), { flag: 'w' })
  }

  async generateLumosConfig() {
    const rpc = new RPC(this.url)
    const block = await rpc.getBlockByNumber('0x0')
    this.#lumosConfig = {
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

  get url(): string {
    return `http://${this.#host}:${this.#port}`
  }

  get port(): string {
    return this.#port
  }

  get host(): string {
    return this.#host
  }

  get lumosConfig(): config.Config {
    return this.#lumosConfig
  }
}
