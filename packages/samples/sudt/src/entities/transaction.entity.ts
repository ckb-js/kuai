import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

export enum TransactionStatus {
  New = 1,
  Pending,
  Committed,
}

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  typeId!: string

  @Column()
  txHash!: string

  @Column({ type: 'tinyint' })
  status!: TransactionStatus

  @Column()
  fromAccountId!: number

  @Column()
  toAccountId!: number

  @Column()
  sudtAmount!: string

  @Column()
  ckbAmount!: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
