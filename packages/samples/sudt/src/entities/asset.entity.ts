import { BI } from '@ckb-lumos/lumos'
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

@Entity()
export class Asset {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  accountId!: number

  @Column()
  balance!: string

  @Column()
  tokenId!: number

  @Column()
  typeId!: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date

  toBI = () => BI.from(this.balance)

  setBalance = (balance: BI) => {
    this.balance = balance.toString()
  }
}
