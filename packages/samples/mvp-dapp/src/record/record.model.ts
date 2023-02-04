import { JSONStore, OutPointString, UpdateStorageValue } from '@ckb-js/kuai-models'

type ItemData = {
  key: string
  value: string
  label: string
}

export type StoreType = {
  data: {
    profile: ItemData[]
    addresses: ItemData[]
    custom: ItemData[]
    dweb: ItemData[]
  }
}

/**
 * add business logic in an actor
 */
export class RecordModel extends JSONStore<StoreType> {
  constructor(
    _schemaOption?: { data: true },
    params?: {
      states?: Record<OutPointString, StoreType>
      chainData?: Record<OutPointString, UpdateStorageValue>
    },
  ) {
    super({ data: true }, params)
  }
}
