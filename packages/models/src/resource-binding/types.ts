import { Cell, Hash } from '@ckb-lumos/base'

export type TypeScriptHash = Hash | 'null'
export type LockScriptHash = Hash

export type RegistryStatus = 'registered' | 'initiated'

export type CellChangeData = [Cell, string]
