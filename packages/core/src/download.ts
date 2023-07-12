import os from 'node:os'
import path from 'node:path'
import decompress from 'decompress'
import fs from 'node:fs'
import { downloadFile } from '@ckb-js/kuai-common'
import { CKB_CLI_RELEASE_URL, DEFAULT_CKB_CLI_VERSION, DEFAULT_BIN_PATH } from './constants'

export interface CKBCLIDownloadOptions {
  version?: string
  dir?: string
}

export class CKBCLIDownloader {
  #binName = os.type() === 'Windows_NT' ? 'ckb-cli.exe' : 'ckb-cli'
  readonly config: Required<CKBCLIDownloadOptions>

  constructor(options?: CKBCLIDownloadOptions) {
    const version = options?.version || DEFAULT_CKB_CLI_VERSION
    const saveToPath = options?.dir || DEFAULT_BIN_PATH

    this.config = { dir: saveToPath, version }
  }

  async downloadIfNotExists(): Promise<string> {
    if (await this.hasDownloaded()) {
      return path.join(this.config.dir, this.#binName)
    }

    const { version, dir } = this.config

    const machine = os.machine()
    const platform = (() => {
      const type = os.type()

      if (type === 'Windows_NT') return 'pc-windows-msvc'
      if (type === 'Darwin') return 'apple-darwin'
      if (type === 'Linux') return 'unknown-linux-gnu'

      throw new Error('Unsupported OS ' + type)
    })()

    const extension = (() => {
      const type = os.type()

      if (type === 'Windows_NT') return 'zip'
      if (type === 'Darwin') return 'zip'
      if (type === 'Linux') return 'tar.gz'

      throw new Error('Unsupported OS ' + type)
    })()

    const zipFilename = `ckb-cli_v${version}_${machine}-${platform}`
    const url = `${CKB_CLI_RELEASE_URL}/v${version}/${zipFilename}.${extension}`
    const zipFilePath = path.join(dir, `${zipFilename}.${extension}`)

    await downloadFile(url, zipFilePath)
    await decompress(zipFilePath, dir)

    fs.cpSync(path.join(dir, zipFilename, this.#binName), path.join(dir, this.#binName))
    fs.rmSync(path.join(dir, zipFilename), { recursive: true })

    return path.join(dir, this.#binName)
  }

  hasDownloaded(): boolean {
    return fs.existsSync(path.join(this.config.dir, this.#binName))
  }

  getBinPath(): string {
    return path.join(this.config.dir, this.#binName)
  }
}
