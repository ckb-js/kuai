import { inject } from 'inversify'
import { DataSource, DataSourceOptions } from 'typeorm'
import { EntityClassOrSchema } from '../interfaces/entity-class-or-schema.type'
import { DEFAULT_DATA_SOURCE_NAME } from '../typeorm.constants'
import { getDataSourceToken, getEntityManagerToken, getRepositoryToken } from './typeorm.utils'

export const InjectRepository = (
  entity: EntityClassOrSchema,
  dataSource: string = DEFAULT_DATA_SOURCE_NAME,
): ReturnType<typeof inject> => inject(getRepositoryToken(entity, dataSource))

export const InjectDataSource = (dataSource?: DataSource | DataSourceOptions | string): ReturnType<typeof inject> =>
  inject(getDataSourceToken(dataSource))

export const InjectEntityManager = (dataSource?: DataSource | DataSourceOptions | string): ReturnType<typeof inject> =>
  inject(getEntityManagerToken(dataSource))
