import { PrimaryGeneratedColumn, Column } from 'typeorm'

import { KuaiEntity, Location } from '../../../src'

@KuaiEntity(Location.Data)
export class User {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string
}
