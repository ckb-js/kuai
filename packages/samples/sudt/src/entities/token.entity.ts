import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm'

@Entity()
export class Token {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column({ default: 18 })
  decimal!: number

  @Column()
  description?: string

  @Column({ default: '' })
  website!: string

  @Column({ default: '' })
  icon!: string

  @Column({ default: '' })
  txHash?: string

  @Column()
  @Index()
  ownerId!: number

  @Column()
  @Unique('uniq_type_id', ['typeId'])
  typeId!: string

  @Column()
  @Unique('uniq_args', ['args'])
  args!: string

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
