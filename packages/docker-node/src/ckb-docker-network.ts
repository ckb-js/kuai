import Docker, { ContainerCreateOptions } from 'dockerode'
import type { StartOptions } from './types'
import { join } from 'node:path'
import fs from 'node:fs'
import { config } from '@ckb-lumos/lumos'
import { generateDevConfig } from './helper'
import { CKBNode } from './interface'
import { CKBNodeBase } from './base'

const CKB_NODE_IMAGE = 'kuai/ckb-dev'
const DOCKER_SOCKET_PATH = process.env.DOCKER_SOCKET || '/var/run/docker.sock'

export class CkbDockerNetwork extends CKBNodeBase implements CKBNode {
  #docker: Docker
  #lumosConfig: config.Config = config.getConfig()
  #port = '8114'
  #host = 'localhost'

  constructor() {
    super()
    this.#docker = new Docker({ socketPath: DOCKER_SOCKET_PATH })
  }

  public async start({ port, detached = false, genesisAccountArgs = [] }: StartOptions): Promise<void> {
    this.#port = port
    const devConfig = generateDevConfig(genesisAccountArgs)
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

  public async stop(): Promise<void> {
    const containers = await this.#docker.listContainers()
    await Promise.all(
      containers
        .filter((container) => container.Image === CKB_NODE_IMAGE)
        .map((container) => this.#docker.getContainer(container.Id).stop()),
    )
  }

  get lumosConfig(): config.Config {
    return this.#lumosConfig
  }

  protected set lumosConfig(config: config.Config) {
    this.#lumosConfig = config
  }

  get url(): string {
    return `http://${this.#host}:${this.#port}`
  }

  get host(): string {
    return this.#host
  }

  get port(): string {
    return this.#port
  }
}
