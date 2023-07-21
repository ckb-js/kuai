import { RPC, config, utils } from '@ckb-lumos/lumos'

// Special cells in genesis transactions: (transaction-index, output-index)
const SpecialCellLocation: {
  [name: string]: [number, number]
} = {
  SIGHASH: [0, 1],
  MULTISIG: [0, 4],
  DAO: [0, 2],
  SIGHASH_GROUP: [1, 0],
  MULTISIG_GROUP: [1, 1],
}

export async function getGenesisScriptsConfig(rpcUrl: string): Promise<Record<string, config.ScriptConfig>> {
  const rpc = new RPC(rpcUrl)
  const genesisBlock = await rpc.getBlockByNumber('0x0')

  const generateGenesisScriptConfig = (transactionIndex: number, outputIndex: number) => {
    const cellTypeScript = genesisBlock.transactions[transactionIndex].outputs[outputIndex].type

    return {
      CODE_HASH: cellTypeScript ? utils.computeScriptHash(cellTypeScript) : '',
      TX_HASH: genesisBlock.transactions[transactionIndex].hash!,
      INDEX: '0x' + outputIndex.toString(16),
    }
  }

  return {
    DAO: {
      HASH_TYPE: 'type',
      ...generateGenesisScriptConfig(...SpecialCellLocation['DAO']),
      DEP_TYPE: 'code',
    },
    SECP256K1_BLAKE160: {
      HASH_TYPE: 'type',
      ...generateGenesisScriptConfig(...SpecialCellLocation['SIGHASH_GROUP']),
      CODE_HASH: generateGenesisScriptConfig(...SpecialCellLocation['SIGHASH']).CODE_HASH,
      DEP_TYPE: 'depGroup',
      SHORT_ID: 0,
    },
    SECP256K1_BLAKE160_MULTISIG: {
      HASH_TYPE: 'type',
      ...generateGenesisScriptConfig(...SpecialCellLocation['MULTISIG_GROUP']),
      CODE_HASH: generateGenesisScriptConfig(...SpecialCellLocation['MULTISIG']).CODE_HASH,
      DEP_TYPE: 'depGroup',
      SHORT_ID: 1,
    },
  }
}
