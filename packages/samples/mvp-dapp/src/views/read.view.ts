import type { ItemData } from '../record/record.model'

export class Read {
  static toJson(data: ItemData): string {
    return JSON.stringify({ value: data.value, optional: data.label })
  }
}
