import { Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import { Category } from './category.entity'
import { User } from './user.entity'

@Entity()
export class Post {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  title!: string

  @Column('text')
  content!: string

  @Column('boolean', { default: true })
  published!: boolean

  @ManyToOne(() => User, (user) => user.posts)
  user!: User

  @ManyToMany(() => Category)
  @JoinTable()
  categories!: Category[]
}
