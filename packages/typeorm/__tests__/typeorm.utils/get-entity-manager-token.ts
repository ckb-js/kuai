import { describe, it, expect } from '@jest/globals'
import { DataSource, DataSourceOptions } from 'typeorm'
import { getEntityManagerToken } from '../../src'

const DEFAULT_DATA_SOURCE_NAME = 'default'

describe(`getEntityManagerToken`, () => {
  it(`should get a default entity manager`, () => {
    expect(getEntityManagerToken()).toBeInstanceOf(Function)
    expect(getEntityManagerToken(DEFAULT_DATA_SOURCE_NAME)).toBeInstanceOf(Function)
  })

  it(`should get an entity manager token if give a name`, () => {
    expect(getEntityManagerToken('a')).toBe('aEntityManager')
    expect(getEntityManagerToken('test')).toBe('testEntityManager')
  })

  it(`should get an entity manager token if give a created data source`, () => {
    const dataSource = new DataSource({
      type: 'postgres',
    })
    expect(getEntityManagerToken(dataSource)).toBeInstanceOf(Function)

    const dataSource1 = new DataSource({
      name: DEFAULT_DATA_SOURCE_NAME,
      type: 'postgres',
    })
    expect(getEntityManagerToken(dataSource1)).toBeInstanceOf(Function)

    const dataSource2 = new DataSource({
      name: 'test',
      type: 'postgres',
    })
    expect(getEntityManagerToken(dataSource2)).toBe('testEntityManager')
  })

  it(`should get an entity manager if give data source options`, () => {
    const dataSourceOptions: DataSourceOptions = {
      type: 'postgres',
    }
    expect(getEntityManagerToken(dataSourceOptions)).toBeInstanceOf(Function)

    const dataSourceOptions1: DataSourceOptions = {
      name: DEFAULT_DATA_SOURCE_NAME,
      type: 'postgres',
    }
    expect(getEntityManagerToken(dataSourceOptions1)).toBeInstanceOf(Function)

    const dataSourceOptions2: DataSourceOptions = {
      name: 'test',
      type: 'postgres',
    }
    expect(getEntityManagerToken(dataSourceOptions2)).toBe('testEntityManager')
  })
})
