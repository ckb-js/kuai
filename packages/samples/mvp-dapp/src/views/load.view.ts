import type { StoreType } from '../record/record.model'

interface Item {
  value: string
  optional?: string
}
export class Load {
  static toJsonString(storage: StoreType): string {
    const profile = new Map<string, Item>()
    storage.data.profile?.forEach((item) => {
      profile.set(item.key, {
        value: item.value,
        optional: item.label,
      })
    })
    const addresses = new Map<string, Item>()
    storage.data.addresses?.forEach((item) => {
      addresses.set(item.key, {
        value: item.value,
        optional: item.label,
      })
    })
    const custom = new Map<string, Item>()
    storage.data.custom?.forEach((item) => {
      custom.set(item.key, {
        value: item.value,
        optional: item.label,
      })
    })
    const dweb = new Map<string, Item>()
    storage.data.dweb?.forEach((item) => {
      dweb.set(item.key, {
        value: item.value,
        optional: item.label,
      })
    })
    return JSON.stringify({
      profile,
      addresses,
      custom,
      dweb,
    })
  }
}
