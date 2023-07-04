import { config } from '@ckb-lumos/lumos'
import { CKBNode } from './interface'
import type { BinNodeStartOptions, BinNodeStopOptions } from './types'
import { spawn, execSync } from 'child_process'
import { generateDevConfig } from './helper'
import fs from 'fs'
import path from 'node:path'
import { CKBNodeBase } from './base'

export class CKBBinNetwork extends CKBNodeBase implements CKBNode {
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

  async #startNode(ckbPath: string, detached: boolean, nodeType: 'indexer' | 'miner') {
    const child = (() => {
      switch (nodeType) {
        case 'indexer':
          return spawn(path.resolve(ckbPath, 'ckb'), ['run', '-C', ckbPath, '--indexer'], {
            detached,
          })
        case 'miner':
          return spawn(path.resolve(ckbPath, 'ckb'), ['miner', '-C', ckbPath], {
            detached,
          })
      }
    })()

    if (child.pid) {
      fs.writeFileSync(path.resolve(ckbPath, 'pid', nodeType), child.pid.toString(), {
        flag: 'w',
        encoding: 'utf-8',
      })
    }
    child.stdout?.on('data', (data) => {
      console.info(data.toString())
    })
    child.stderr?.on('data', (data) => {
      console.info(data.toString())
    })

    if (detached) {
      child.unref()
    }
  }

  start({ detached = true, ckbPath, genesisAccountArgs, port }: BinNodeStartOptions): void {
    this.#port = port
    this.#initConfig(ckbPath, genesisAccountArgs)
    this.#startNode(ckbPath, detached, 'indexer')
    this.#startNode(ckbPath, detached, 'miner')
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

  protected set lumosConfig(config: config.Config) {
    this.#lumosConfig = config
  }
}
