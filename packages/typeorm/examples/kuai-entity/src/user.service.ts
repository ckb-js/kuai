import { DataSource, EntityManager, Repository } from 'typeorm'
import { InjectDataSource, InjectRepository, InjectEntityManager, Service } from '../../../src'
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
