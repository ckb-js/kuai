import { execSync } from 'node:child_process'
import path from 'node:path'
import { paramTypes } from '../params'
import { task, subtask } from '../config/config-env'
import { getUserConfigPath } from '../project-structure'
import { CKBCLI } from '../ckb-cli'

declare module '../type/runtime' {
  export interface RuntimeEnvironment {
    ckbcli?: CKBCLI
  }
}

task('signer', 'built-in signer').setAction(async () => {
  execSync('kuai signer --help', { stdio: 'inherit' })
})

subtask('signer:get-signer', 'get built-in signer').setAction(async (_, env) => {
  if (env.ckbcli) {
    return env.ckbcli
  }

  const ckbcli = new CKBCLI({ url: env.config.ckbChain.rpcUrl })

  const userConfigPath = getUserConfigPath()
  if (!userConfigPath) {
    throw new Error('Please run in kuai project')
  }

  await ckbcli.prepareCKBCLI({
    dir: path.join(path.dirname(userConfigPath), '.bin'),
  })

  env.ckbcli = ckbcli
  return ckbcli
})

subtask('signer:account-list', 'list accounts of built-in signer')
  .addParam('console', 'console output', false, paramTypes.boolean, true)
  .setAction(async (args: { console: boolean }, { run }) => {
    const signer = (await run('signer:get-signer')) as CKBCLI
    const result = signer.account.list()

    if (args.console) {
      console.log(result)
    }

    return result
  })

interface AccountNewArgs {
  password: string
  console: boolean
}

subtask('signer:account-new', 'create new account for built-in signer')
  .addParam('password', 'The password of account')
  .addParam('console', 'console output', false, paramTypes.boolean, true)
  .setAction(async (args: AccountNewArgs, { run }) => {
    const signer = (await run('signer:get-signer')) as CKBCLI

    const result = signer.account.new({ password: args.password })

    if (args.console) {
      console.log(result)
    }

    return result
  })

interface AccountImportArgs {
  privkeyPath: string
  password: string
  extendedPrivkeyPath?: string
  console: boolean
}

subtask('signer:account-import', 'import an unencrypted private key from <privkey-path> and create a new account')
  .addParam(
    'privkey-path',
    'The privkey is assumed to contain an unencrypted private key in hexadecimal format. (only read first line)',
  )
  .addParam('password', 'The Password to lock your account', '', paramTypes.string, true)
  .addParam('extended-privkey-path', 'Extended private key path (include master private key and chain code)')
  .addParam('console', 'console output', false, paramTypes.boolean, true)
  .setAction(async ({ privkeyPath, extendedPrivkeyPath, password, ...args }: AccountImportArgs, { run }) => {
    const signer = (await run('signer:get-signer')) as CKBCLI
    const result = signer.account.import({ privkeyPath, extendedPrivkeyPath, password })

    if (args.console) {
      console.log(result)
    }

    return result
  })

interface AccountExportArgs {
  lockArgs: string
  password: string
  extendedPrivkeyPath: string
  console: boolean
}

subtask('signer:account-export', 'export master private key and chain code as hex plain text (USE WITH YOUR OWN RISK)')
  .addParam('lock-args', 'Lock argument (account identifier, blake2b(pubkey)[0..20])')
  .addParam('password', 'The Password for unlock your account', '', paramTypes.string, true)
  .addParam('extended-privkey-path', ' Output extended private key path (PrivKey + ChainCode)')
  .addParam('console', 'console output', false, paramTypes.boolean, true)
  .setAction(async ({ lockArgs, extendedPrivkeyPath, password, ...args }: AccountExportArgs, { run }) => {
    const signer = (await run('signer:get-signer')) as CKBCLI
    const result = signer.account.export({ lockArg: lockArgs, extendedPrivkeyPath, password })

    if (args.console) {
      console.log(result)
    }

    return result
  })

interface UtilSignMessageArgs {
  privkeyPath?: string
  fromAccount?: string
  extendedAddress?: string
  message: string
  console: boolean
  recoverable: boolean
}

subtask('signer:util-sign-message', 'sign message with secp256k1 signature')
  .addParam('message', 'The message to be signed (32 bytes)')
  .addParam('privkey-path', 'Private key file path (only read first line)', undefined, paramTypes.string, true)
  .addParam(
    'from-account',
    "The account's lock-args or sighash address (transfer from this account)",
    undefined,
    paramTypes.string,
    true,
  )
  .addParam(
    'extended-address',
    "The address extended from `m/44'/309'/0'` (Search 2000 receiving addresses and 2000 change addresses max)",
    undefined,
    paramTypes.string,
    true,
  )
  .addParam('recoverable', 'recoverable', true, paramTypes.boolean, true)
  .addParam('console', 'console output', false, paramTypes.boolean, true)
  .setAction(async ({ console: isConsole, ...args }: UtilSignMessageArgs, { run }) => {
    const signer = (await run('signer:get-signer')) as CKBCLI
    const result = signer.util.signMessage(args)

    if (isConsole) {
      console.log(result)
    }

    return result
  })
