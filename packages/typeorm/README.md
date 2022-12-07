# Description

Inject [TypeOrm](https://github.com/typeorm/typeorm) by [InversifyJs](https://github.com/inversify/InversifyJS).

# Usage

We assume that you are familiar with [TypeOrm](https://github.com/typeorm/typeorm).

Install the required dependencies.

```
npm install --save @kuai/typeorm
```

We need at least one entity, so we define the `User` entity firstly.

```
// user.entity.ts

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string
}
```

To use `Datasource` and `EntityManager`, we need to bind them to the container using `TypeOrmManager.importRoot()`, and they will be available to inject across the entire project.

- Note: To begin using the `User` entity, we need to let `TypeORM` know about it by inserting it into the entities array (unless you use a static glob path).

```
// app.ts

import { TypeOrmManager } from '@kuai/typeorm'
import { User } from './user.entity'

await TypeOrmManager.importRoot({
  type: 'mysql',
  host: 'localhost',
  port: 5432,
  username: 'test',
  password: 'test',
  database: 'test',
  synchronize: true,
  logging: false,
  entities: [User],
  migrations: [],
  subscribers: [],
})
```

TypeORM supports the repository design pattern, so each entity has its own repository. These repositories can be obtained from the database data source.

We can use `TypeOrmManager.importRepository()` to define which repositories are bound to the container. So the bound repositories will be also available to inject across the entire project.

```
// app.ts

await TypeOrmManager.importRepository([User])
```

Let's define the `UserService` to operate `User` entities.

Then we can inject the `DataSource`, `EntityManager` or `UsersRepository` into the `UsersService`:

- inject `DataSource` using the `@InjectDataSource()`
- inject `EntityManager` using the `@InjectEntityManager()`
- inject `UsersRepository` using the `@InjectRepository()`

And the `UserService` also needed to be bounded to the container by `@Service()`, so that it can be created correctly by the container using the injected `DataSource`, `EntityManager` or `UsersRepository`.

```
// user.service.ts

import { DataSource, EntityManager, Repository } from 'typeorm'
import { InjectDataSource, InjectRepository, InjectEntityManager, Service } from '@kuai/typeorm'
import { User } from './user.entity'

@Service()
export class UserService {
  @InjectDataSource()
  private dataSource!: DataSource

  @InjectEntityManager()
  private entityManager!: EntityManager

  constructor(@InjectRepository(User) private repository: Repository<User>) {}

  saveByRepository(user: User): Promise<User> {
    return this.repository.save(user)
  }

  saveByManager(user: User): Promise<User> {
    return this.entityManager.save(user)
  }

  async saveManyByTransaction(users: User[]): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner()

    await queryRunner.connect()
    await queryRunner.startTransaction()
    try {
      for (const user of users) {
        await queryRunner.manager.save(user)
      }
      await queryRunner.commitTransaction()
    } catch (err) {
      await queryRunner.rollbackTransaction()
    } finally {
      await queryRunner.release()
    }
  }

  findAll(): Promise<User[]> {
    return this.repository.find()
  }
}
```

It's time to get the created `UserService` from the container by `container.get<UserService>(UserService.name)` and operate `User` entities!

```
// app.ts

import { contanier } from '@kuai/typeorm'

const userOne = new User()
userOne.id = 1
userOne.name = `Alice`

const userTwo = new User()
userTwo.id = 2
userTwo.name = `Bob`

const userThree = new User()
userThree.id = 3
userThree.name = `Olivia`

const userFour = new User()
userFour.id = 4
userFour.name = `Ada`

const service = container.get<UserService>(UserService.name)

/** Save through the various methods. */
await service.saveByRepository(userOne)
await service.saveByManager(userTwo)
await service.saveManyByTransaction([userThree, userFour])

/** Load the saved users so we can assert on them. */
const userList = await service.findAll()
console.log({ userList })
```

At last, we can close the connection with the database. Once connection is closed, we cannot use repositories or perform any operations except opening connection again.

```
// app.ts

try {
  await TypeOrmManager.destroyDataSource()
} cache (e) {
  // log error
}
```

# Examples

All examples are available [here](https://github.com/ckb-js/kuai/packages/typeorm/examples).
