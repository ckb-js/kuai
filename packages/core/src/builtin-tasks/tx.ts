import { execSync } from 'node:child_process'
import { paramTypes } from '../params'
import { task, subtask } from '../config/config-env'
import { CKBCLI } from '../ckb-cli'

interface TxCommandCommonArgs {
  txFile: string
}

task('tx', 'build tx helper').setAction(async () => {
  execSync('kuai tx --help', { stdio: 'inherit' })
})

// todo
// subtask('tx:generate-empty-tx')
// subtask('tx:generate-deploy-tx')
// subtask('tx:generate-upgrade-tx')
// subtask('tx:pay-fee')
// subtask('tx:inject-capacity')
// subtask('tx:get-signing-entries')
// subtask('tx:parse')
// subtask('tx:format')

subtask('tx:init', 'Init a common (sighash/multisig) transaction')
  .addParam('tx-file', 'Multisig transaction data file (format: json)')
  .setAction(async ({ txFile }: TxCommandCommonArgs, { run }) => {
    const signer = (await run('signer:get-signer')) as CKBCLI
    const result = signer.tx.init({ txFile })
    return result
  })

interface AddInputArgs extends TxCommandCommonArgs {
  txHash: string
  index: number
  sinceAbsoluteEpoch?: number
}

subtask('tx:add-input', 'Add cell input (with secp/multisig lock)')
  .addParam('tx-file', 'Multisig transaction data file (format: json)')
  .addParam('tx-hash', 'Transaction hash')
  .addParam('index', 'Transaction output index as input', undefined, paramTypes.number, false)
  .addParam('since-absolute-epoch', 'Since(absolute epoch number)', undefined, paramTypes.number, true)
  .setAction(async ({ txFile, txHash, index, sinceAbsoluteEpoch }: AddInputArgs, { run }) => {
    const signer = (await run('signer:get-signer')) as CKBCLI
    const result = signer.tx.addInput({ txFile, txHash, index, sinceAbsoluteEpoch })
    return result
  })

interface AddOutputArgs extends TxCommandCommonArgs {
  toSighashAddress?: string
  toMultisigAddress?: string
  capacity: string
  toData?: string
  toDataPath?: string
}

subtask('tx:add-output', 'Add cell output')
  .addParam('tx-file', 'Multisig transaction data file (format: json)')
  .addParam('to-sighash-address', 'To normal sighash address', undefined, paramTypes.string, false)
  .addParam(
    'to-multisig-address',
    'To long multisig address (special case, include since)',
    undefined,
    paramTypes.string,
    false,
  )
  .addParam('capacity', 'The capacity (unit: CKB, format: 123.335)')
  .addParam('to-data', 'Hex data store in target cell (optional)', undefined, paramTypes.string, false)
  .addParam(
    'to-data-path',
    'Data binary file path store in target cell (optional)',
    undefined,
    paramTypes.string,
    false,
  )
  .setAction(async (args: AddOutputArgs, { run }) => {
    const signer = (await run('signer:get-signer')) as CKBCLI
    const result = signer.tx.addOutput({ toLongMultisigAddress: args.toMultisigAddress, ...args })
    return result
  })

interface AddSignatureArgs extends TxCommandCommonArgs {
  lockArgs: string
  signature: string
}

subtask('tx:add-signature', 'Add signature')
  .addParam('tx-file', 'Multisig transaction data file (format: json)')
  .addParam('lock-args', 'The lock_arg of input lock script (20 bytes or 28 bytes)')
  .addParam('signature', 'The signature')
  .setAction(async (args: AddSignatureArgs, { run }) => {
    const signer = (await run('signer:get-signer')) as CKBCLI
    const result = signer.tx.addSignature({ lockArg: args.lockArgs, ...args })
    return result
  })

interface SignInputsArgs extends TxCommandCommonArgs {
  privkeyPath?: string
  fromAccount?: string
}

subtask('tx:sign-inputs', 'Sign all sighash/multisig inputs in this transaction')
  .addParam('tx-file', 'Multisig transaction data file (format: json)')
  .addParam('privkey-path', 'Private key file path (only read first line)', undefined, paramTypes.string, false)
  .addParam(
    'from-account',
    "The account's lock-args or sighash address (transfer from this account)",
    undefined,
    paramTypes.string,
    false,
  )
  .setAction(async (args: SignInputsArgs, { run }) => {
    const signer = (await run('signer:get-signer')) as CKBCLI
    const result = signer.tx.signInputs(args)
    return result
  })

interface AddMultisigConfigArgs extends TxCommandCommonArgs {
  sighashAddress: string[]
  requireFirstN: number
  threshold: number
}
subtask('tx:add-multisig-config', 'Add multisig config')
  .addParam('tx-file', 'Multisig transaction data file (format: json)')
  .addParam('sighash-address', 'Normal sighash address', undefined, paramTypes.string, false, true)
  .addParam(
    'require-first-n',
    'Require first n signatures of corresponding pubkey [default: 0]',
    0,
    paramTypes.number,
    true,
  )
  .addParam('threshold', 'Multisig threshold [default: 1]', 1, paramTypes.number, true)
  .setAction(async (args: AddMultisigConfigArgs, { run }) => {
    const signer = (await run('signer:get-signer')) as CKBCLI
    const result = signer.tx.addMultisigConfig(args)
    return result
  })

interface SendArgs extends TxCommandCommonArgs {
  maxTxFee?: number
}

subtask('tx:send', 'Send multisig transaction')
  .addParam('tx-file', 'Multisig transaction data file (format: json)')
  .addParam('max-tx-fee', 'Max transaction fee (unit: CKB) [default: 1.0]', 1, paramTypes.number, true)
  .setAction(async (args: SendArgs, { run }) => {
    const signer = (await run('signer:get-signer')) as CKBCLI
    const result = signer.tx.send(args)
    return result
  })
