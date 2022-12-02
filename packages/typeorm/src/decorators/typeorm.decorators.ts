import { inject } from 'inversify'
import { DataSource, DataSourceOptions } from 'typeorm'
import { EntityClassOrSchema } from '../interfaces/entity-class-or-schema.type'
import { DEFAULT_DATA_SOURCE_NAME } from '../typeorm.constants'
import { getDataSourceToken, getEntityManagerToken, getRepositoryToken } from '../typeorm.utils'

type InjectedType = ReturnType<typeof inject>

export const InjectRepository = (
  entity: EntityClassOrSchema,
  dataSource: string = DEFAULT_DATA_SOURCE_NAME,
): InjectedType => inject(getRepositoryToken(entity, dataSource))

export const InjectDataSource = (dataSource?: DataSource | DataSourceOptions | string): InjectedType =>
  inject(getDataSourceToken(dataSource))

export const InjectEntityManager = (dataSource?: DataSource | DataSourceOptions | string): InjectedType =>
  inject(getEntityManagerToken(dataSource))
