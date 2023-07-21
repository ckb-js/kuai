import { describe, it, expect } from '@jest/globals'
import { interfaces, METADATA_KEY } from 'inversify'
import { DataSource, EntityManager, Repository } from 'typeorm'
import { InjectRepository, InjectDataSource, InjectEntityManager } from '../../src'

class User {}

export class UserService {
  private dataSource!: DataSource
  private entityManager!: EntityManager
  private repository: Repository<User>

  constructor(repository: Repository<User>) {
    this.repository = repository
  }
}

describe(`typeorm decorators`, () => {
  InjectDataSource()(UserService.prototype, 'dataSource')
  InjectEntityManager()(UserService.prototype, 'entityManager')
  InjectRepository(User)(UserService.prototype, 'repository')

  it(`should get properties by METADATA_KEY.TAGGED_PROP`, () => {
    const metadataKey = METADATA_KEY.TAGGED_PROP
    const paramsMetadata = Reflect.getMetadata(metadataKey, UserService)

    expect(paramsMetadata['dataSource']).toBeInstanceOf(Array)
    const m1: interfaces.Metadata = paramsMetadata['dataSource'][0]
    expect(m1.key).toBe(METADATA_KEY.INJECT_TAG)
    expect(m1.value).toBeInstanceOf(Function)

    expect(paramsMetadata['entityManager']).toBeInstanceOf(Array)
    const m2: interfaces.Metadata = paramsMetadata['entityManager'][0]
    expect(m2.key).toBe(METADATA_KEY.INJECT_TAG)
    expect(m2.value).toBeInstanceOf(Function)

    expect(paramsMetadata['repository']).toBeInstanceOf(Array)
    const m3: interfaces.Metadata = paramsMetadata['repository'][0]
    expect(m3.key).toBe(METADATA_KEY.INJECT_TAG)
    expect(m3.value).toBe('UserRepository')
  })
})
