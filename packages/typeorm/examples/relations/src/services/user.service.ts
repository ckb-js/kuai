import { EntityManager, Repository } from 'typeorm'
import { InjectRepository, InjectEntityManager, Service } from '../../../../src'
import { User } from '../entities'

@Service()
export class UserService {
  @InjectEntityManager()
  private entityManager!: EntityManager

  constructor(@InjectRepository(User) private repository: Repository<User>) {}

  saveByManager(user: User): Promise<User> {
    return this.entityManager.save(user)
  }

  findAll(): Promise<User[]> {
    return this.repository.find()
  }
}
