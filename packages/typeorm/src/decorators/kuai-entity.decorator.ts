import { Entity, EntityOptions } from 'typeorm'

export enum Location {
  Data = '_data',
  Witness = '_witness',
}

export const KuaiEntity =
  (nameSuffix: Location, nameOrOptions?: string | EntityOptions, maybeOptions?: EntityOptions) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (cls: new (...args: any[]) => unknown): void => {
    let name = cls.name
    if (nameOrOptions) {
      if ('string' === typeof nameOrOptions) {
        name = nameOrOptions
      } else if (nameOrOptions.name) {
        name = nameOrOptions.name
      }
    }
    Entity(name + nameSuffix, maybeOptions)(cls)
  }
