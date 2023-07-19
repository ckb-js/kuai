import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import type { Hash } from '@ckb-lumos/base'

export type ContractMigration = {
  cell_recipes: Array<{
    name: string
    tx_hash: Hash
    index: number
    occupied_capacity?: number
    data_hash: Hash
    type_id: Hash
  }>
}

export function generateMigrationFileName() {
  const current = new Date()
  // YYYY-MM-DD-HHmmss.json
  return `${current.getFullYear()}-${current.getMonth().toString().padStart(2, '0')}-${current
    .getDay()
    .toString()
    .padStart(2, '0')}-${current.getHours().toString().padStart(2, '0')}${current
    .getMinutes()
    .toString()
    .padStart(2, '0')}${current.getSeconds().toString().padStart(2, '0')}.json`
}

export function findMigrationByDir(dir: string, name: string) {
  const files = readdirSync(dir)
  const migrations = files.filter((file) => file.endsWith('.json'))

  for (const migrationFileName of migrations) {
    try {
      const migration: ContractMigration = JSON.parse(readFileSync(path.join(dir, migrationFileName), 'utf-8'))
      const cell = migration.cell_recipes.find((cell) => cell.name === name)
      if (cell) {
        return cell
      }
    } catch {
      // do nothing
    }
  }
}
