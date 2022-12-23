import { Repository } from 'typeorm'
import { InjectRepository, Service } from '../../../../src'
import { Category } from '../entities'

@Service()
export class CategoryService {
  constructor(@InjectRepository(Category) private repository: Repository<Category>) {}

  saveByRepository(category: Category): Promise<Category> {
    return this.repository.save(category)
  }

  findAll(): Promise<Category[]> {
    return this.repository.find()
  }
}
