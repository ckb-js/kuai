import { Observable, defer, lastValueFrom } from 'rxjs'
import { retry } from 'rxjs/operators'
import { DataSource, EntityManager, EntitySchema, Repository } from 'typeorm'
import { DEFAULT_DATA_SOURCE_NAME } from './typeorm.constants'
import { DataSourceOptions, EntityClassOrSchema, TypeOrmOptions } from './interfaces'

export function getRepositoryToken(
  entity: EntityClassOrSchema,
  dataSource: DataSource | DataSourceOptions | string = DEFAULT_DATA_SOURCE_NAME,
  // eslint-disable-next-line @typescript-eslint/ban-types
): Function | string {
  const dataSourcePrefix = getDataSourcePrefix(dataSource)
  if (entity instanceof Function && entity.prototype instanceof Repository) {
    if (!dataSourcePrefix) {
      return entity
    }
    return `${dataSourcePrefix}${getCustomRepositoryToken(entity)}`
  }

  if (entity instanceof EntitySchema) {
    const token = `${dataSourcePrefix}${
      entity.options.target ? entity.options.target.name : entity.options.name
    }Repository`
    return token
  }
  return `${dataSourcePrefix}${entity.name}Repository`
}

// eslint-disable-next-line @typescript-eslint/ban-types
export function getCustomRepositoryToken(repository: Function): string {
  return repository.name
}

export function getDataSourceToken(
  dataSource: DataSource | DataSourceOptions | string = DEFAULT_DATA_SOURCE_NAME,
  // eslint-disable-next-line @typescript-eslint/ban-types
): string | Function {
  return DEFAULT_DATA_SOURCE_NAME === dataSource
    ? DataSource
    : 'string' === typeof dataSource
    ? `${dataSource}DataSource`
    : DEFAULT_DATA_SOURCE_NAME === dataSource.name || !dataSource.name
    ? DataSource
    : `${dataSource.name}DataSource`
}

export function getDataSourcePrefix(
  dataSource: DataSource | DataSourceOptions | string = DEFAULT_DATA_SOURCE_NAME,
): string {
  if (dataSource === DEFAULT_DATA_SOURCE_NAME) {
    return ''
  }
  if (typeof dataSource === 'string') {
    return dataSource + '_'
  }
  if (dataSource.name === DEFAULT_DATA_SOURCE_NAME || !dataSource.name) {
    return ''
  }
  return dataSource.name + '_'
}

export function getEntityManagerToken(
  dataSource: DataSource | DataSourceOptions | string = DEFAULT_DATA_SOURCE_NAME,
  // eslint-disable-next-line @typescript-eslint/ban-types
): string | Function {
  return DEFAULT_DATA_SOURCE_NAME === dataSource
    ? EntityManager
    : 'string' === typeof dataSource
    ? `${dataSource}EntityManager`
    : DEFAULT_DATA_SOURCE_NAME === dataSource.name || !dataSource.name
    ? EntityManager
    : `${dataSource.name}EntityManager`
}

export async function createDataSource(options: TypeOrmOptions, shouldInitialize = true): Promise<DataSource> {
  if (shouldInitialize) {
    return lastValueFrom(
      defer(() => {
        const dataSource = new DataSource(options as DataSourceOptions)
        return dataSource.initialize()
      }).pipe(handleRetry(options.retryAttempts, options.retryInterval)),
    )
  } else {
    const dataSource = new DataSource(options as DataSourceOptions)
    return Promise.resolve(dataSource)
  }
}

function handleRetry(retryAttempts = 10, retryInterval = 3000): <T>(source: Observable<T>) => Observable<T> {
  return <T>(source: Observable<T>) =>
    source.pipe(
      retry({
        count: retryAttempts,
        delay: retryInterval,
      }),
    )
}
