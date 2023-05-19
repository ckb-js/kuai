import Docker, { ContainerCreateOptions } from 'dockerode'
import { DockerNodeStartOptions, InfraScript } from './types'
import { join } from 'node:path'
import fs from 'node:fs'
import path from 'node:path'
import { Address, Indexer, RPC, commons, helpers, hd, Transaction, config } from '@ckb-lumos/lumos'
import { waitUntilCommitted } from '@ckb-js/kuai-common'

const CKB_NODE_IMAGE = 'kuai/ckb-dev'
const DOCKER_SOCKET_PATH = process.env.DOCKER_SOCKET || '/var/run/docker.sock'

export class CkbDockerNetwork {
  #docker: Docker
  #lumosConfig: config.Config = config.getConfig()
  #port = '8114'
  #host = 'localhost'

  constructor() {
    this.#docker = new Docker({ socketPath: DOCKER_SOCKET_PATH })
  }

  private generateDevConfig(genesisAccountArgs: string[] = []): string {
    const generateGenesisAccount = (args: string) => `
[[genesis.issued_cells]]
capacity = 20_000_000_000_00000000
lock.code_hash = "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8"
lock.args = "${args}"
lock.hash_type = "type"\n`
    const extraConfig = genesisAccountArgs.reduce((a, b) => a + generateGenesisAccount(b), '')
    const config = fs.readFileSync(join(__dirname, '../ckb', 'dev-template.toml'), 'utf-8')

    return config + extraConfig
  }

  public async start({ port, detached = false, genesisAccountArgs = [] }: DockerNodeStartOptions): Promise<void> {
    this.#port = port
    const devConfig = this.generateDevConfig(genesisAccountArgs)
    fs.writeFileSync(join(__dirname, '../ckb', 'dev.toml'), devConfig)

    const config: ContainerCreateOptions = {
      HostConfig: {
        AutoRemove: true,
        PortBindings: { '8114/tcp': [{ HostPort: this.#port }] },
      },
    }

    const buildStream = await this.#docker.buildImage(
      {
        context: join(__dirname, '../ckb'),
        src: ['Dockerfile', 'dev.toml', 'ckb-miner.toml', 'entrypoint.sh'],
      },
      { t: CKB_NODE_IMAGE },
    )

    await new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.#docker.modem.followProgress(buildStream, (err: any, res: any) => (err ? reject(err) : resolve(res)))
    })

    if (!detached) {
      return this.#docker.run(CKB_NODE_IMAGE, [], process.stdout, config)
    }

    const container = await this.#docker.createContainer({
      Image: CKB_NODE_IMAGE,
      Tty: false,
      ...config,
    })

    return container.start()
  }

  private async doDeploy(
    rpc: RPC,
    indexer: Indexer,
    from: Address,
    privateKey: string,
    script: string,
    filePath: string,
  ): Promise<InfraScript> {
    const scriptBinary = fs.readFileSync(filePath)
    const txHash = await rpc.sendTransaction(
      this.sign(
        (
          await commons.deploy.generateDeployWithDataTx({
            cellProvider: indexer,
            scriptBinary,
            fromInfo: from,
          })
        ).txSkeleton,
        privateKey,
      ),
    )

    try {
      await waitUntilCommitted(rpc, txHash)
    } catch (e) {
      console.error(e)
    }

    return {
      name: script,
      path: filePath,
      cellDep: {
        depType: 'code',
        outPoint: {
          txHash,
          index: '0x0',
        },
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
      const configs = JSON.parse(fs.readFileSync(filePath).toString())
      if (configs.custom && Array.isArray(configs.custom)) {
        for (const script of configs.custom) {
          scripts.push(await this.doDeploy(rpc, indexer, from, privateKey, script, script.path))
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
  }: {
    builtInScriptName: string[]
    configFilePath: string
    builtInDirPath: string
    indexer: Indexer
    rpc: RPC
    privateKey: string
  }): Promise<void> {
    const from = helpers.encodeToConfigAddress(hd.key.privateKeyToBlake160(privateKey), 'SECP256K1_BLAKE160')
    await indexer.waitForSync()
    const config = {
      builtIn: await this.deployBuiltInScripts(builtInScriptName, builtInDirPath, indexer, rpc, from, privateKey),
      custom: await this.deployCustomScripts(configFilePath, indexer, rpc, from, privateKey),
    }

    console.log(configFilePath)
    fs.writeFileSync(configFilePath, Buffer.from(JSON.stringify(config)), { flag: 'w' })
  }

  public async stop(): Promise<void> {
    const containers = await this.#docker.listContainers()
    await Promise.all(
      containers
        .filter((container) => container.Image === CKB_NODE_IMAGE)
        .map((container) => this.#docker.getContainer(container.Id).stop()),
    )
  }

  public async generateLumosConfig(): Promise<void> {
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

  get lumosConfig(): config.Config {
    return this.#lumosConfig
  }

  get url(): string {
    return `http://${this.#host}:${this.#port}`
  }
}
