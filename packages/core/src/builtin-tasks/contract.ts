import { execSync } from 'node:child_process'
import read from 'read'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { KuaiError } from '@ckb-js/kuai-common'
import { ERRORS } from '../errors-list'
import type { FromInfo } from '@ckb-lumos/common-scripts'
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

interface ContractDeployArgs {
  name: string
  from: string[]
  signer: 'ckb-cli' | 'ckb-cli-multisig'
  feeRate: number
}

function parseFromInfoByCli(info: string[]): FromInfo[] {
  if (info[0] === 'multisig') {
    if (!info[1] || !Number.isInteger(parseInt(info[1]))) {
      throw new KuaiError(ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE, {
        name: 'r',
        value: info[1],
        type: 'number',
      })
    }

    if (!info[2] || !Number.isInteger(parseInt(info[2]))) {
      throw new KuaiError(ERRORS.ARGUMENTS.INVALID_VALUE_FOR_TYPE, {
        name: 'm',
        value: info[2],
        type: 'number',
      })
    }

    const hashes = info.slice(3)

    if (hashes.length === 0) {
      throw new KuaiError(ERRORS.ARGUMENTS.MISSING_TASK_ARGUMENT, {
        param: 'multisig hashes',
      })
    }

    return [
      {
        R: parseInt(info[1]),
        M: parseInt(info[2]),
        publicKeyHashes: hashes,
      },
    ]
  }

  return info
}

subtask('contract:deploy')
  .addParam('name', 'name of the contract to be deployed', '', paramTypes.string, false)
  .addParam('from', 'address or multisig config of the contract deployer', '', paramTypes.string, false, true)
  .addParam(
    'signer',
    'signer provider [default: ckb-cli] [possible values: ckb-cli, ckb-cli-multisig]',
    'ckb-cli',
    paramTypes.string,
    true,
  )
  .addParam(
    'feeRate',
    "per transaction's fee, deployment may involve more than one transaction. default: [1000] shannons/Byte",
    1000,
    paramTypes.number,
    true,
  )
  .setAction(async (args: ContractDeployArgs, { config, run }) => {
    const { name, from, feeRate, signer } = args
    const { ckbChain } = config

    const fromInfos = parseFromInfoByCli(from)
    const workspace = (await run('contract:get-workspace')) as string

    if (!name) {
      throw new KuaiError(ERRORS.BUILTIN_TASKS.NOT_SPECIFY_CONTRACT)
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

    const messageSigner: MessageSigner = (message, fromInfo) => {
      const { multisigScript } = parseFromInfo(fromInfo, { config: lumosConfig })
      return run('contract:sign-message', {
        message,
        address: encodeToAddress(parseFromInfo(fromInfo, { config: lumosConfig }).fromScript, { config: lumosConfig }),
        signer,
        prefix: multisigScript,
      }) as Promise<string>
    }

    const deployer = new ContractDeployer(messageSigner, {
      rpcUrl: config.ckbChain.rpcUrl,
      config: lumosConfig,
    })

    const result = await deployer.deploy(conrtactBinPath, fromInfos[0], { feeRate })
    console.info('deploy success, txHash: ', result.txHash)
    return result.txHash
  })

subtask('contract:sign-message')
  .addParam('message', 'message to be signed', '', paramTypes.string, false)
  .addParam('address', 'the address of message signer', '', paramTypes.string, false)
  .addParam('prefix', 'the prefix of signature', '', paramTypes.string, true)
  .addParam(
    'signer',
    'signer provider [default: ckb-cli] [possible values: ckb-cli, ckb-cli-multisig]',
    'ckb-cli',
    paramTypes.string,
    true,
  )
  .setAction(async ({ message, address, prefix = '', signer }): Promise<string> => {
    if (signer === 'ckb-cli') {
      const password = await read({ prompt: `Input ${address}'s password for sign messge by ckb-cli:`, silent: true })
      console.info('')
      return signMessageByCkbCli(message, address, password)
    }

    if (signer === 'ckb-cli-multisig') {
      const preSigningAddresses = (
        await read({ prompt: `Input the signing addresses or args for sign multisig, separated by spaces: ` })
      ).split(' ')
      if (!Array.isArray(preSigningAddresses) || preSigningAddresses.length === 0) {
        throw new KuaiError(ERRORS.BUILTIN_TASKS.NOT_SPECIFY_SIGNING_ADDRESS)
      }

      let multisigs: string[] = []
      for (const addr of preSigningAddresses) {
        const password = await read({ prompt: `Input ${addr}'s password for sign messge by ckb-cli:`, silent: true })
        console.info('')
        const sig = signMessageByCkbCli(message, addr, password).slice(2)
        multisigs = [...multisigs, sig]
      }

      return `${prefix}${multisigs.join('')}`
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
