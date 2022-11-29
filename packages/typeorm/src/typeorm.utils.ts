import { Observable, defer, lastValueFrom } from 'rxjs'
import { delay, retryWhen, scan } from 'rxjs/operators'
import {
  AbstractRepository,
  Connection,
  DataSource,
  DataSourceOptions,
  EntityManager,
  EntitySchema,
  Repository,
  createConnection,
} from 'typeorm'
import { CircularDependencyError } from './errors/circular-dependency.error'
import { EntityClassOrSchema } from './interfaces/entity-class-or-schema.type'
import { DEFAULT_DATA_SOURCE_NAME } from './typeorm.constants'
import { TypeOrmOptions } from './interfaces/typeorm-options.interface'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Type<T = any> extends Function {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): T
}

export function getRepositoryToken(
  entity: EntityClassOrSchema,
  dataSource: DataSource | DataSourceOptions | string = DEFAULT_DATA_SOURCE_NAME,
  // eslint-disable-next-line @typescript-eslint/ban-types
): Function | string {
  if (entity === null || entity === undefined) {
    throw new CircularDependencyError('@InjectRepository()')
  }
  const dataSourcePrefix = getDataSourcePrefix(dataSource)
  if (
    entity instanceof Function &&
    (entity.prototype instanceof Repository || entity.prototype instanceof AbstractRepository)
  ) {
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
  if (repository === null || repository === undefined) {
    throw new CircularDependencyError('@InjectRepository()')
  }
  return repository.name
}

export function getDataSourceToken(
  dataSource: DataSource | DataSourceOptions | string = DEFAULT_DATA_SOURCE_NAME,
  // eslint-disable-next-line @typescript-eslint/ban-types
): string | Function | Type<DataSource> {
  return DEFAULT_DATA_SOURCE_NAME === dataSource
    ? DataSource ?? Connection
    : 'string' === typeof dataSource
    ? `${dataSource}DataSource`
    : DEFAULT_DATA_SOURCE_NAME === dataSource.name || !dataSource.name
    ? DataSource ?? Connection
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

export async function createDataSource(options: TypeOrmOptions): Promise<DataSource> {
  const createTypeormDataSource = (options: DataSourceOptions) => {
    return DataSource === undefined ? createConnection(options) : new DataSource(options)
  }
  return await lastValueFrom(
    defer(async () => {
      const dataSource = await createTypeormDataSource(options as DataSourceOptions)
      return dataSource.initialize()
    }).pipe(handleRetry(options.retryAttempts, options.retryDelay, options.toRetry)),
  )
}

function handleRetry(
  retryAttempts = 9,
  retryDelay = 3000,
  toRetry?: (err: unknown) => boolean,
): <T>(source: Observable<T>) => Observable<T> {
  return <T>(source: Observable<T>) =>
    source.pipe(
      retryWhen((e) =>
        e.pipe(
          scan((errorCount, error: Error) => {
            if (toRetry && !toRetry(error)) {
              throw error
            }
            if (errorCount + 1 >= retryAttempts) {
              throw error
            }
            return errorCount + 1
          }, 0),
          delay(retryDelay),
        ),
      ),
    )
}
