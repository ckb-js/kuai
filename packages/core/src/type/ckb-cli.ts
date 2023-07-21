export type CKBCLIAccount = {
  '#': number
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

export type CKBCLINewAccount = Pick<CKBCLIAccount, 'address' | 'address(deprecated)' | 'lock_arg' | 'lock_hash'>

type Command<OPTIONS, RESULT> = (options: OPTIONS) => RESULT

export type TxCommands = {
  init: Command<{ txFile: string }, void>
  addMultisigConfig: Command<
    { sighashAddress: string[]; requireFirstN: number; threshold: number; txFile: string },
    void
  >
  clearField: Command<{ field: 'inputs' | 'outputs' | 'signatures'; txFile: string }, void>
  addInput: Command<{ txHash: string; index: number; sinceAbsoluteEpoch?: number; txFile: string }, void>
  addOutput: Command<
    {
      toSighashAddress?: string
      toShortMultisigAddress?: string
      toLongMultisigAddress?: string
      capacity: string
      toData?: string
      toDataPath?: string
      txFile: string
    },
    void
  >
  addSignature: Command<
    {
      lockArg: string
      signature: string
      txFile: string
    },
    void
  >
  signInputs: Command<
    {
      privkeyPath?: string
      fromAccount?: string
      txFile: string
    },
    void
  >
  send: Command<{ txFile: string; maxTxFee?: number }, string>
  buildMultisigAddress: Command<
    {
      sighashAddress: string[]
      requireFirstN: number
      threshold: number
      txFile: string
      sinceAbsoluteEpoch?: number
    },
    string
  >
}

export type AccountCommands = {
  list: Command<void, CKBCLIAccount[]>
  new: Command<{ password: string }, CKBCLINewAccount>
  import: Command<{ privkeyPath: string; password: string; extendedPrivkeyPath?: string }, CKBCLINewAccount>
  importKeystore: Command<{ path: string; password: string }, CKBCLINewAccount>
  export: Command<{ lockArg: string; extendedPrivkeyPath: string; password: string }, { message: string }>
  remove: Command<{ lockArg: string }, { filepath: string }>
}

export type UtilCommands = {
  signMessage: Command<
    {
      recoverable?: boolean
      privkeyPath?: string
      fromAccount?: string
      extendedAddress?: string
      message: string
    },
    {
      signature: string
    }
  >
}
