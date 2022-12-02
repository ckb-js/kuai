import { describe, it, expect } from '@jest/globals'
import { DataSource, DataSourceOptions, Entity, Repository } from 'typeorm'
import { container, TypeOrmManager } from '../src'

class User {}

describe(`TypeOrmManager`, () => {
  Entity()(User)

  it(`should get default data source and repository`, async () => {
    await TypeOrmManager.importRoot(
      {
        type: 'postgres',
        entities: [User],
      },
      false,
    )
    await TypeOrmManager.importRepository([User])

    expect(TypeOrmManager.getDataSource()).toBeInstanceOf(DataSource)
    expect(container.get('UserRepository')).toBeInstanceOf(Repository)
  })

  it(`should get data source and repository if give a name`, async () => {
    await TypeOrmManager.importRoot(
      {
        type: 'postgres',
        name: 'test',
        entities: [User],
      },
      false,
    )
    await TypeOrmManager.importRepository([User], 'test')

    expect(TypeOrmManager.getDataSource('test')).toBeInstanceOf(DataSource)
    expect(container.get('test_UserRepository')).toBeInstanceOf(Repository)
  })

  it(`should get default data source and repository if give data source options`, async () => {
    const options: DataSourceOptions = {
      type: 'postgres',
      name: 'test1',
      entities: [User],
    }
    await TypeOrmManager.importRoot(options, false)
    await TypeOrmManager.importRepository([User], options)

    expect(TypeOrmManager.getDataSource(options)).toBeInstanceOf(DataSource)
    expect(container.get('test1_UserRepository')).toBeInstanceOf(Repository)
  })
})
