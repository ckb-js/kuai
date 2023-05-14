import { execSync } from 'node:child_process'
import read from 'read'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { KuaiError } from '@ckb-js/kuai-common'
import { ERRORS } from '../errors-list'
import { parseFromInfo } from '@ckb-lumos/common-scripts'
import { encodeToAddress } from '@ckb-lumos/helpers'
import { Config } from '@ckb-lumos/config-manager'
import { ContractDeployer } from '../contract'
import type { MessageSigner } from '../contract'
import { signMessageByCkbCli } from '../ckb-cli'
import { task, subtask } from '../config/config-env'
import { paramTypes } from '../params'
import { getUserConfigPath } from '../project-structure'
import { getGenesisScriptsConfig } from '../util/chain'

task('contract').setAction(async () => {
  execSync('kuai contract --help', { stdio: 'inherit' })
})

subtask('contract:deploy')
  .addParam('name', 'name of the contract to be deployed', '', paramTypes.string, false)
  .addParam('address', 'address of the contract deployer', '', paramTypes.string, false)
  .addParam(
    'feeRate',
    "per transaction's fee, deployment may involve more than one transaction. default: [1000] shannons/Byte",
    1000,
    paramTypes.number,
    true,
  )
  .setAction(async ({ name, address, feeRate }, { config, run }) => {
    const { ckbChain } = config
    const workspace = (await run('contract:get-workspace')) as string

    if (!name) {
      throw new KuaiError(ERRORS.BUILTIN_TASKS.NOT_SPECIFY_CONTRACT)
    }

    if (!address) {
      throw new KuaiError(ERRORS.BUILTIN_TASKS.NOT_SPECIFY_DEPLOYER_ADDRESS)
    }

    const conrtactBinPath = path.join(workspace, `build/release/${name}`)

    if (!existsSync(conrtactBinPath)) {
      throw new KuaiError(ERRORS.BUILTIN_TASKS.CONTRACT_RELEASE_FILE_NOT_FOUND, {
        var: name,
      })
    }

    const lumosConfig: Config = {
      PREFIX: ckbChain.prefix,
      SCRIPTS: ckbChain.scripts || {
        ...(await getGenesisScriptsConfig(ckbChain.rpcUrl)),
      },
    }

    const signer: MessageSigner = (message, fromInfo) =>
      run('contract:sign-message', {
        message,
        address: encodeToAddress(parseFromInfo(fromInfo, { config: lumosConfig }).fromScript, { config: lumosConfig }),
      }) as Promise<string>

    const deployer = new ContractDeployer(signer, {
      rpcUrl: config.ckbChain.rpcUrl,
      config: lumosConfig,
    })

    const result = await deployer.deploy(conrtactBinPath, address, { feeRate })
    console.info('deploy success, txHash: ', result.txHash)
    return result.txHash
  })

subtask('contract:sign-message')
  .addParam('message', 'message to be signed', '', paramTypes.string, false)
  .addParam('address', 'the address of message signer', '', paramTypes.string, false)
  .addParam('signer', 'signer provider, default: ckb-cli', 'ckb-cli', paramTypes.string, true)
  .setAction(async ({ message, address, signer }): Promise<string> => {
    if (signer === 'ckb-cli') {
      const password = await read({ prompt: `Input ${address}'s password for sign messge by ckb-cli:`, silent: true })
      console.info('')
      return signMessageByCkbCli(message, address, password)
    }

    throw new KuaiError(ERRORS.BUILTIN_TASKS.UNSUPPORTED_SIGNER, {
      var: signer,
    })
  })

subtask('contract:get-workspace').setAction(async (_, { config }) => {
  if (config.contract?.workspace) {
    return config.contract?.workspace
  }

  const userConfigPath = getUserConfigPath()
  if (!userConfigPath) {
    throw new Error('Please run in kuai project file')
  }

  return path.join(path.dirname(userConfigPath), 'contract')
})

subtask('contract:set-environment').setAction(async () => {
  // todo: download ckb-cli & capsule etc...
})

interface BuildArgs {
  name?: string
  release?: boolean
}

subtask('contract:build')
  .addParam('name', 'contract name', '', paramTypes.string, true)
  .addParam('release', 'build contracts in release mode', false, paramTypes.boolean, true)
  .setAction(async ({ name, release }: BuildArgs, { run }) => {
    const workspace = await run('contract:get-workspace')
    execSync(`cd ${workspace} && capsule build${name ? ` --name ${name}` : ''}${release ? ' --release' : ''}`, {
      stdio: 'inherit',
    })
  })

interface NewArgs {
  name: string
  template: string
}

subtask('contract:new')
  .addParam('name', 'The name of new contract')
  .addParam(
    'template',
    'language template  [default: rust]  [possible values: rust, c, c-sharedlib]',
    'rust',
    paramTypes.string,
    true,
  )
  .setAction(async ({ name, template }: NewArgs, { run }) => {
    const workspace = await run('contract:get-workspace')
    execSync(`cd ${workspace} && capsule new-contract ${name} --template ${template}`, { stdio: 'inherit' })
  })
