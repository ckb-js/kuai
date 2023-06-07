import { execSync } from 'node:child_process'
import { join } from 'node:path'
import { writeFileSync, rmSync } from 'node:fs'
import type { ExecSyncOptions } from 'node:child_process'
import { key } from '@ckb-lumos/hd'
import { CKBCLIDownloader } from './download'
import { KuaiError } from '@ckb-js/kuai-common'
import { ERRORS } from './errors-list'
import { DEFAULT_NETWORKDS, DEFAULT_CKB_CLI_VERSION, DEFAULT_DEVNET_ACCOUNT_PKS } from './constants'
import { AccountCommands, CKBCLIAccount, UtilCommands, TxCommands } from './type/ckb-cli'
import { kebabCaseKeys } from './util/case'
import { extractJsonFromString } from './util/json'
import { omit } from 'lodash'

interface CKBCLIOptions {
  url?: string
  outputFormat?: 'json' | 'yaml'
}

export class CKBCLI {
  binPath = 'ckb-cli'
  homeDir = '~/.ckb-cli'
  outputFormat: CKBCLIOptions['outputFormat']
  rpcUrl = ''

  constructor(options: CKBCLIOptions) {
    const { url = DEFAULT_NETWORKDS['devnet'].rpcUrl } = options
    this.rpcUrl = url
    this.outputFormat = options.outputFormat || 'json'
  }

  async prepareCKBCLI({
    dir,
    version = DEFAULT_CKB_CLI_VERSION,
    download = true,
    initialAccountPks = DEFAULT_DEVNET_ACCOUNT_PKS,
  }: {
    dir: string
    version?: string
    download?: boolean
    initialAccountPks?: string[]
  }) {
    const downloader = new CKBCLIDownloader({ dir, version })
    if (!download && !downloader.hasDownloaded()) {
      throw new KuaiError(ERRORS.GENERAL.CKB_CLI_NOT_FOUND)
    }

    this.binPath = await downloader.downloadIfNotExists()
    this.homeDir = join(dir, '.ckb-cli')

    const existesAccounts = this.account.list()
    const existesAccountsMap: Record<string, CKBCLIAccount> = existesAccounts.reduce(
      (acc, cur) => ({ ...acc, [cur.lock_arg]: cur }),
      {},
    )

    initialAccountPks.forEach((pk) => {
      const args = key.privateKeyToBlake160(pk)
      if (existesAccountsMap[args]) {
        return
      }

      const path = join(dir, 'pk')
      writeFileSync(path, pk)
      this.account.import({ privkeyPath: path, password: '' })
      rmSync(path)
    })
  }

  account: AccountCommands = {
    list: () => {
      return this.exec(['account', 'list'])
    },
    new: (options) => {
      return this.exec(['account', 'new'], omit(options, ['password']), { input: options.password })
    },
    import: (options) => {
      return this.exec(['account', 'import'], omit(options, ['password']), {
        input: `${options.password}\n${options.password}`,
      })
    },
    importKeystore: (options) => {
      return this.exec(['account', 'import-keystore'], omit(options, ['password']), {
        input: `${options.password}\n${options.password}`,
      })
    },
    export: (options) => {
      return this.exec(['account', 'export'], omit(options, ['password']), { input: options.password })
    },
    remove: (options) => {
      return this.exec(['account', 'remove'], options)
    },
  }

  util: UtilCommands = {
    signMessage: (options) => {
      return this.exec(['util', 'sign-message'], options)
    },
  }

  tx: TxCommands = {
    init: (options) => {
      return this.exec(['tx', 'init'], options)
    },
    addMultisigConfig: (options) => {
      return this.exec(['tx', 'add-multisig-config'], options)
    },
    clearField: (options) => {
      return this.exec(['tx', 'clear-field'], options)
    },
    addInput: (options) => {
      return this.exec(['tx', 'add-input'], options)
    },
    addOutput: (options) => {
      return this.exec(['tx', 'add-output'], options)
    },
    addSignature: (options) => {
      return this.exec(['tx', 'add-signature'], options)
    },
    signInputs: (options) => {
      return this.exec(['tx', 'sign-inputs'], options)
    },
    send: (options) => {
      return this.exec(['tx', 'send'], options)
    },
    buildMultisigAddress: (options) => {
      return this.exec(['tx', 'build-multisig-address'], options)
    },
  }

  paramsToArgs(params: object) {
    return Object.entries(kebabCaseKeys(params))
      .map(([key, value]) => {
        if (value === true) return `--${key}`
        return `--${key} ${value}`
      })
      .join(' ')
  }

  exec(subcommands: string[], params: object = {}, options?: ExecSyncOptions) {
    const env = {
      API_URL: this.rpcUrl,
      CKB_CLI_HOME: this.homeDir,
    }

    const args = this.paramsToArgs(params)
    const command = `${this.binPath} ${subcommands.join(' ')} ${args} --output-format json`
    const output = execSync(command, {
      env,
      ...options,
    })

    const result = extractJsonFromString(output.toString())
    if (result.length > 0) {
      return result[result.length - 1]
    }

    return null
  }
}

export function getCkbCliAccounts(): Array<CKBCLIAccount> {
  const output = execSync(`ckb-cli account list --output-format json`, {
    stdio: 'inherit',
  })

  return JSON.parse(output.toString())
}

export function signMessageByCkbCli(message: string, account: string, password: string): string {
  const output = execSync(
    `ckb-cli util sign-message --message ${message} --from-account ${account} --recoverable --output-format json`,
    {
      input: password,
      encoding: 'utf-8',
      stdio: 'pipe',
    },
  )

  const json = output.substring(output.indexOf('{'), output.lastIndexOf('}') + 1)

  return JSON.parse(json).signature
}
