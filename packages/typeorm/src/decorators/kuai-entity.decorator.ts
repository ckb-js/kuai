import { Entity, EntityOptions } from 'typeorm'

export enum Location {
  Data = '_data',
  Witness = '_witness',
}

export const KuaiEntity =
  (name_suffix: Location, nameOrOptions?: string | EntityOptions, maybeOptions?: EntityOptions) =>
  (cls: new (...args: never[]) => unknown): void => {
    let name = cls.name
    if (nameOrOptions) {
      if ('string' === typeof nameOrOptions) {
        name = nameOrOptions
      } else if (nameOrOptions.name) {
        name = nameOrOptions.name
      }
    }
    Entity(name + name_suffix, maybeOptions)(cls)
  }
