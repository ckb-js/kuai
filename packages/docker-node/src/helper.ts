import fs from 'fs'
import { join } from 'node:path'
import { request } from 'undici'

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

export const CKBLatestBinVersion = async (): Promise<string | undefined> => {
  const { body } = await request('https://api.github.com/repos/nervosnetwork/ckb/releases/latest', {
    method: 'GET',
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'CKB-Js-Kuai-DApp' },
  })
  const json = await body.json()

  return json.tag_name
}
