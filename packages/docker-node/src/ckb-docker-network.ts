import Docker, { ContainerCreateOptions } from 'dockerode'
import { DockerNodeStartOptions, InfraScript } from './types'
import { join } from 'node:path'
import fs from 'node:fs'
import path from 'node:path'
import { Address, Indexer, RPC, commons, helpers, hd } from '@ckb-lumos/lumos'
import { sign } from '@ckb-js/kuai-core'

const CKB_NODE_IMAGE = 'kuai/ckb-dev'
const DOCKER_SOCKET_PATH = process.env.DOCKER_SOCKET || '/var/run/docker.sock'

export class CkbDockerNetwork {
  private _docker: Docker

  constructor() {
    this._docker = new Docker({ socketPath: DOCKER_SOCKET_PATH })
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
    const devConfig = this.generateDevConfig(genesisAccountArgs)
    fs.writeFileSync(join(__dirname, '../ckb', 'dev.toml'), devConfig)

    const config: ContainerCreateOptions = {
      HostConfig: {
        AutoRemove: true,
        PortBindings: { '8114/tcp': [{ HostPort: port }] },
      },
    }

    const buildStream = await this._docker.buildImage(
      {
        context: join(__dirname, '../ckb'),
        src: ['Dockerfile', 'dev.toml', 'ckb-miner.toml', 'entrypoint.sh'],
      },
      { t: CKB_NODE_IMAGE },
    )

    await new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this._docker.modem.followProgress(buildStream, (err: any, res: any) => (err ? reject(err) : resolve(res)))
    })

    if (!detached) {
      return this._docker.run(CKB_NODE_IMAGE, [], process.stdout, config)
    }

    const container = await this._docker.createContainer({
      Image: CKB_NODE_IMAGE,
      Tty: false,
      ...config,
    })

    return container.start()
  }

  private async deployInfraScripts(
    indexer: Indexer,
    rpc: RPC,
    from: Address,
    privateKey: string,
  ): Promise<InfraScript[]> {
    const dirPath = path.resolve(__dirname, '../built-in/scripts')
    return await Promise.all(
      fs.readdirSync(dirPath).map(async (script) => {
        const scriptBinary = fs.readFileSync(path.join(dirPath, script, 'bin'))
        const txHash = await rpc.sendTransaction(
          sign(
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
        return {
          name: script,
          path: path.join(dirPath, script),
          cellDep: {
            depType: 'code',
            outPoint: {
              txHash,
              index: '0x0',
            },
          },
        }
      }),
    )
  }
  private async deployCustomScripts(
    filePath: string,
    indexer: Indexer,
    rpc: RPC,
    from: Address,
    privateKey: string,
  ): Promise<InfraScript[]> {
    return await Promise.all(
      (JSON.parse(fs.readFileSync(filePath).toString()) as InfraScript[]).map(async (script) => {
        const scriptBinary = fs.readFileSync(script.path)
        const txHash = await rpc.sendTransaction(
          sign(
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
        return {
          name: script.name,
          path: script.path,
          cellDep: {
            depType: 'code',
            outPoint: {
              txHash,
              index: '0x0',
            },
          },
        }
      }),
    )
  }

  public async deployScripts(filePath: string, indexer: Indexer, rpc: RPC, privateKey: string): Promise<void> {
    const from = helpers.encodeToConfigAddress(hd.key.privateKeyToBlake160(privateKey), 'SECP256K1_BLAKE160')
    await indexer.waitForSync()
    const config = (await this.deployInfraScripts(indexer, rpc, from, privateKey)).concat(
      await this.deployCustomScripts(filePath, indexer, rpc, from, privateKey),
    )

    fs.writeFileSync(filePath, Buffer.from(JSON.stringify(config)))
  }

  public async stop(): Promise<void> {
    const containers = await this._docker.listContainers()
    await Promise.all(
      containers
        .filter((container) => container.Image === CKB_NODE_IMAGE)
        .map((container) => this._docker.getContainer(container.Id).stop()),
    )
  }
}
