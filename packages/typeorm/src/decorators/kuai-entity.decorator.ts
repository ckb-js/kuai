import { Entity, EntityOptions } from 'typeorm'

export enum Location {
  Data = '_data',
  Witness = '_witness',
}

/*
The last two parameters are the original parameters of Entity in TypeOrm.
The first parameter indicates the position of the data in the transaction, such as cell.data or tx.witness,
and it serves as a suffix to the original table name.
*/
export const KuaiEntity =
  (nameSuffix: Location, nameOrOptions?: string | EntityOptions, maybeOptions?: EntityOptions) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (cls: new (...args: any[]) => unknown): void => {
    if (nameOrOptions) {
      if ('string' === typeof nameOrOptions) {
        Entity(nameOrOptions + nameSuffix, maybeOptions)(cls)
      } else {
        if (nameOrOptions.name) {
          nameOrOptions.name = nameOrOptions.name + nameSuffix
        } else {
          nameOrOptions.name = cls.name + nameSuffix
        }
        Entity(nameOrOptions)(cls)
      }
    } else {
      Entity(cls.name + nameSuffix)(cls)
    }
  }
