import download from 'download'
import * as os from 'node:os'
import path from 'node:path'
import * as fs from 'node:fs'
import { cpSync, rmSync } from 'node:fs'
import { CKB_CLI_RELEASE_URL, DEFAULT_CKB_CLI_VERSION, DEFAULT_BIN_PATH } from './constants'

export interface CKBCLIDownloadOptions {
  version?: string
  dir?: string
}

export class CKBCLIDownloader {
  readonly config: Required<CKBCLIDownloadOptions>

  constructor(options?: CKBCLIDownloadOptions) {
    const version = options?.version || DEFAULT_CKB_CLI_VERSION
    const saveToPath = options?.dir || DEFAULT_BIN_PATH

    this.config = { dir: saveToPath, version }
  }

  async downloadIfNotExists(): Promise<string> {
    if (await this.hasDownloaded()) {
      return path.join(this.config.dir, 'ckb-cli')
    }

    const { version, dir } = this.config

    const machine = os.machine()
    const osType = (() => {
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

    const zipFilename = `ckb-cli_v${version}_${machine}-${osType}`

    const url = `${CKB_CLI_RELEASE_URL}/v${version}/${zipFilename}.${extension}`
    await download(url, dir, { extract: true })
    cpSync(path.join(dir, zipFilename, 'ckb-cli'), path.join(dir, 'ckb-cli'))
    rmSync(path.join(dir, zipFilename), { recursive: true })

    return path.join(dir, 'ckb-cli')
  }

  hasDownloaded(): boolean {
    return fs.existsSync(path.join(this.config.dir, 'ckb-cli'))
  }

  getBinPath(): string {
    return path.join(this.config.dir, 'ckb-cli')
  }
}
