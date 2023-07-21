import { EntityManager, Repository } from 'typeorm'
import { InjectRepository, InjectEntityManager, Service } from '../../../../src'
import { Post } from '../entities'

@Service()
export class PostService {
  @InjectEntityManager()
  private entityManager!: EntityManager

  constructor(@InjectRepository(Post) private repository: Repository<Post>) {}

  saveByManager(post: Post): Promise<Post> {
    return this.entityManager.save(post)
  }

  findAll(): Promise<Post[]> {
    return this.repository.find()
  }
}
