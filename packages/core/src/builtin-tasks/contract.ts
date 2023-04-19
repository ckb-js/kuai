import { execSync } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'
import TOML from '@iarna/toml'
import { key } from '@ckb-lumos/hd'
import { generateAddress } from '@ckb-lumos/helpers'
import { predefined } from '@ckb-lumos/config-manager'
import { Script } from '@ckb-lumos/base'
import { task, subtask } from '../config/config-env'
import { paramTypes } from '../params'
import { getUserConfigPath } from '../project-structure'

task('contract').setAction(async () => {
  execSync('kuai contract --help', { stdio: 'inherit' })
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

interface ImportArgs {
  privateKey: string
}

subtask('contract:import-private-key')
  .addParam('privateKey', '', '', paramTypes.string, false)
  .setAction(async ({ privateKey }: ImportArgs) => {
    const lockArg = key.privateKeyToBlake160(privateKey)

    const res = execSync('ckb-cli account list --output-format json').toString()
    const accountList: Array<{ lock_arg: string }> = JSON.parse(res)

    if (accountList.some((account) => account.lock_arg === lockArg)) {
      return
    }

    fs.writeFileSync('./.tmp_pk', privateKey)

    console.log('add the user to ckb-cli, enter a password for the signature please')
    execSync('ckb-cli account import --privkey-path ./.tmp_pk', { stdio: 'inherit' })

    fs.rmSync('./.tmp_pk')
  })

interface BuildArgs {
  name?: string
  release?: boolean
}

subtask('contract:build')
  .addParam('name', 'contract name', '', paramTypes.string, true)
  .addParam('release', 'Build contracts in release mode', false, paramTypes.boolean, true)
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
    console.log('workspace', workspace)
    execSync(`cd ${workspace} && capsule new-contract ${name} --template ${template}`, { stdio: 'inherit' })
  })

interface DeployArgs {
  name?: string
  chain?: string
  isMainnet?: boolean
  fee: number
  env: string
  migrate: string
}

subtask('contract:deploy')
  .addParam('name', 'name of the contract to be deployed', '', paramTypes.string, true)
  .addParam(
    'chain',
    'ckb rpc url or name [default: dev]  [possible values: dev, test, mainnet, http://localhost:8114 etc...]',
    'dev',
    paramTypes.string,
    true,
  )
  .addParam('isMainnet', '', false, paramTypes.boolean, true)
  .addParam(
    'fee',
    "Per transaction's fee, deployment may involve more than one transaction. default: [1]",
    1,
    paramTypes.number,
    true,
  )
  .addParam(
    'env',
    'Deployment environment. [default: dev]  [possible values: dev, production]',
    'dev',
    paramTypes.string,
    true,
  )
  .addParam(
    'migrate',
    'Use previously deployed cells as inputs. [default: on]  [possible values: on, off]',
    'on',
    paramTypes.string,
    true,
  )
  .setAction(async ({ name, chain, fee, env, migrate, ...args }: DeployArgs, { config, run }) => {
    const isMainnet = chain === 'mainnet' ? true : args.isMainnet

    const workspace = (await run('contract:get-workspace')) as string
    const { type = 'ckb-cli', deployerPrivateKey } = config.contract?.deployment || {}

    if (type !== 'ckb-cli') {
      throw new Error('Other deployment options are not supported temporary')
    }

    if (!deployerPrivateKey) {
      throw new Error('please set deployerPrivateKey in kuai.config.js')
    }

    await run('contract:import-private-key', { privateKey: deployerPrivateKey })

    const deployerLock: Script = {
      codeHash: '0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8',
      args: key.privateKeyToBlake160(deployerPrivateKey),
      hashType: 'type',
    }
    const { lock = deployerLock } = config.contract?.deployment || {}

    // setting capsule config
    const capsuleConfigFile = fs.readFileSync(path.join(workspace, 'capsule.toml'), 'utf-8')
    const deploymentConfigFile = fs.readFileSync(path.join(workspace, 'deployment.toml'), 'utf-8')

    const capsuleConfig = TOML.parse(capsuleConfigFile)
    const deploymentConfig = TOML.parse(deploymentConfigFile)

    const contractNames = (capsuleConfig['contracts'] as Array<{ name: string }>).map((contract) => contract.name)
    const deployedContractName = name || contractNames[0]

    const generateContractDeployConfig = (name: string, enableTypeId = true) => {
      return {
        name,
        enable_type_id: enableTypeId,
        location: { file: `build/release/${name}` },
      }
    }

    deploymentConfig['cells'] = [generateContractDeployConfig(deployedContractName)]
    deploymentConfig['lock'] = {
      code_hash: lock.codeHash,
      args: lock.args,
      hash_type: lock.hashType,
    }

    fs.writeFileSync(path.join(workspace, 'deployment.toml'), TOML.stringify(deploymentConfig))

    const ckbRpcUrl = (() => {
      if (chain === 'dev') {
        return 'http://localhost:8114'
      }

      if (chain === 'test') {
        return 'https://testnet.ckb.dev/rpc'
      }

      if (chain === 'mainnet') {
        return 'https://mainnet.ckb.dev/rpc'
      }

      return chain
    })()

    const deployerAddress = generateAddress(deployerLock, { config: isMainnet ? predefined.LINA : predefined.AGGRON4 })

    console.log('deployed', deployedContractName, 'to', ckbRpcUrl, ', deployer', deployerAddress)

    execSync(
      `cd ${workspace} && capsule deploy --address ${deployerAddress} --api ${ckbRpcUrl} --fee ${fee} --env ${env} --migrate ${migrate}`,
      {
        stdio: 'inherit',
      },
    )
  })
