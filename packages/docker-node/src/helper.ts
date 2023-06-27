import fs from 'fs'
import { join } from 'node:path'

export const generateDevConfig = (genesisAccountArgs: string[] = []): string => {
  const generateGenesisAccount = (args: string) => `
[[genesis.issued_cells]]
capacity = 20_000_000_000_00000000
lock.code_hash = "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8"
lock.args = "${args}"
lock.hash_type = "type"\n`
  const extraConfig = genesisAccountArgs.reduce((a, b) => a + generateGenesisAccount(b), '')
  const config = fs.readFileSync(join(__dirname, '../ckb', 'dev-template.toml'), 'utf-8')

  return config + extraConfig
}
