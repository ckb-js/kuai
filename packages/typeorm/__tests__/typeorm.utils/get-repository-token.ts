import { describe, it, expect } from '@jest/globals'
import { DataSource, DataSourceOptions, Entity, EntitySchema, Repository } from 'typeorm'
import { getRepositoryToken } from '../../src'

const DEFAULT_DATA_SOURCE_NAME = 'default'

class UserEntity {}
class User {}
class UserRepository extends Repository<User> {}

describe(`getRepositoryToken`, () => {
  Entity()(UserEntity)

  const dataSource = new DataSource({
    type: 'postgres',
  })

  const dataSource1 = new DataSource({
    name: DEFAULT_DATA_SOURCE_NAME,
    type: 'postgres',
  })

  const dataSource2 = new DataSource({
    name: 'test',
    type: 'postgres',
  })

  const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
  }

  const dataSourceOptions1: DataSourceOptions = {
    name: DEFAULT_DATA_SOURCE_NAME,
    type: 'postgres',
  }

  const dataSourceOptions2: DataSourceOptions = {
    name: 'test',
    type: 'postgres',
  }

  describe(`entity instanceof EntityClass`, () => {
    it(`should get a default repository token`, () => {
      expect(getRepositoryToken(UserEntity)).toBe('UserEntityRepository')
      expect(getRepositoryToken(UserEntity, DEFAULT_DATA_SOURCE_NAME)).toBe('UserEntityRepository')
    })

    it(`should get a repository token if give a data source name`, () => {
      expect(getRepositoryToken(UserEntity, 'a')).toBe('a_UserEntityRepository')
      expect(getRepositoryToken(UserEntity, 'test')).toBe('test_UserEntityRepository')
    })

    it(`should get a repository token if give a data source`, () => {
      expect(getRepositoryToken(UserEntity, dataSource)).toBe('UserEntityRepository')
      expect(getRepositoryToken(UserEntity, dataSource1)).toBe('UserEntityRepository')
      expect(getRepositoryToken(UserEntity, dataSource2)).toBe('test_UserEntityRepository')
    })

    it(`should get a repository token if give data source options`, () => {
      expect(getRepositoryToken(UserEntity, dataSourceOptions)).toBe('UserEntityRepository')
      expect(getRepositoryToken(UserEntity, dataSourceOptions1)).toBe('UserEntityRepository')
      expect(getRepositoryToken(UserEntity, dataSourceOptions2)).toBe('test_UserEntityRepository')
    })
  })

  describe(`entity instanceof EntitySchema`, () => {
    describe(`EntityScema without the 'target' field`, () => {
      const UserSchema = new EntitySchema<User>({
        name: 'user',
        columns: {},
      })

      it(`should get a default repository token`, () => {
        expect(getRepositoryToken(UserSchema)).toBe('userRepository')
        expect(getRepositoryToken(UserSchema, DEFAULT_DATA_SOURCE_NAME)).toBe('userRepository')
      })

      it(`should get a repository token if give a data source name`, () => {
        expect(getRepositoryToken(UserSchema, 'a')).toBe('a_userRepository')
        expect(getRepositoryToken(UserSchema, 'test')).toBe('test_userRepository')
      })

      it(`should get a repository token if give a data source`, () => {
        expect(getRepositoryToken(UserSchema, dataSource)).toBe('userRepository')
        expect(getRepositoryToken(UserSchema, dataSource1)).toBe('userRepository')
        expect(getRepositoryToken(UserSchema, dataSource2)).toBe('test_userRepository')
      })

      it(`should get a repository token if give data source options`, () => {
        expect(getRepositoryToken(UserSchema, dataSourceOptions)).toBe('userRepository')
        expect(getRepositoryToken(UserSchema, dataSourceOptions1)).toBe('userRepository')
        expect(getRepositoryToken(UserSchema, dataSourceOptions2)).toBe('test_userRepository')
      })
    })

    describe(`EntityScema with the 'target' field`, () => {
      const UserSchema = new EntitySchema<User>({
        name: 'user',
        target: User,
        columns: {},
      })

      it(`should get a default repository token`, () => {
        expect(getRepositoryToken(UserSchema)).toBe('UserRepository')
        expect(getRepositoryToken(UserSchema, DEFAULT_DATA_SOURCE_NAME)).toBe('UserRepository')
      })

      it(`should get a repository token if give a data source name`, () => {
        expect(getRepositoryToken(UserSchema, 'a')).toBe('a_UserRepository')
        expect(getRepositoryToken(UserSchema, 'test')).toBe('test_UserRepository')
      })

      it(`should get a repository token if give a data source`, () => {
        expect(getRepositoryToken(UserSchema, dataSource)).toBe('UserRepository')
        expect(getRepositoryToken(UserSchema, dataSource1)).toBe('UserRepository')
        expect(getRepositoryToken(UserSchema, dataSource2)).toBe('test_UserRepository')
      })

      it(`should get a repository token if give data source options`, () => {
        expect(getRepositoryToken(UserSchema, dataSourceOptions)).toBe('UserRepository')
        expect(getRepositoryToken(UserSchema, dataSourceOptions1)).toBe('UserRepository')
        expect(getRepositoryToken(UserSchema, dataSourceOptions2)).toBe('test_UserRepository')
      })
    })
  })

  describe(`entity.prototype instanceof Repository`, () => {
    it(`should get a default repository`, () => {
      expect(getRepositoryToken(UserRepository)).toBeInstanceOf(Function)
      expect(getRepositoryToken(UserRepository, DEFAULT_DATA_SOURCE_NAME)).toBeInstanceOf(Function)
    })

    it(`should get a repositoryif token give a data source name`, () => {
      expect(getRepositoryToken(UserRepository, 'a')).toBe('a_UserRepository')
      expect(getRepositoryToken(UserRepository, 'test')).toBe('test_UserRepository')
    })

    it(`should get a repository token if give a data source`, () => {
      expect(getRepositoryToken(UserRepository, dataSource)).toBeInstanceOf(Function)
      expect(getRepositoryToken(UserRepository, dataSource1)).toBeInstanceOf(Function)
      expect(getRepositoryToken(UserRepository, dataSource2)).toBe('test_UserRepository')
    })

    it(`should get a repository token if give data source options`, () => {
      expect(getRepositoryToken(UserRepository, dataSourceOptions)).toBeInstanceOf(Function)
      expect(getRepositoryToken(UserRepository, dataSourceOptions1)).toBeInstanceOf(Function)
      expect(getRepositoryToken(UserRepository, dataSourceOptions2)).toBe('test_UserRepository')
    })
  })
})
