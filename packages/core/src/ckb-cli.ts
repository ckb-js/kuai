import { execSync } from 'node:child_process'

interface CkbCliAccount {
  address: {
    mainnet: string
    testnet: string
  }
  'address(deprecated)': {
    mainnet: string
    testnet: string
  }
  has_ckb_pubkey_derivation_root_path: boolean
  lock_arg: string
  lock_hash: string
  source: string
}

export function getCkbCliAccounts(): Array<CkbCliAccount> {
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
