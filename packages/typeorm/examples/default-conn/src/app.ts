import { ok } from 'assert'
import { container, TypeOrmManager } from '../../../src'
import { UserService } from './user.service'
import { User } from './user.entity'

export async function startApp(): Promise<void> {
  await TypeOrmManager.importRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'test',
    password: 'test',
    database: 'test',
    synchronize: true,
    logging: false,
    entities: [User],
    migrations: [],
    subscribers: [],
  })
  await TypeOrmManager.importRepository([User])

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

  for (const user of userList) {
    ok(user instanceof User)
  }

  await TypeOrmManager.destroyDataSource()
}
