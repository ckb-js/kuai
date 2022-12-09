import { Column, Entity, JoinTable, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { Post } from './post.entity'

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @OneToMany(() => Post, (post) => post.user)
  @JoinTable()
  posts!: Post[]
}
