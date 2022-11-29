import {
  DataSource,
  DataSourceOptions,
  EntityManager,
  EntityMetadata,
  Repository,
  TreeRepository,
  MongoRepository,
} from 'typeorm'
import { Container } from 'inversify'
import { createDataSource, getDataSourceToken, getEntityManagerToken, getRepositoryToken } from './typeorm.utils'
import { TypeOrmOptions } from './interfaces/typeorm-options.interface'
import { EntityClassOrSchema } from './interfaces/entity-class-or-schema.type'
import { DEFAULT_DATA_SOURCE_NAME } from './typeorm.constants'

export const container = new Container()

export type DataSourceProvider = () => Promise<DataSource>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TypeOrmRepository = Repository<any> | TreeRepository<any> | MongoRepository<any>

export class TypeOrmManager {
  /**
   * Bind DataSource and EntityManager to the container.
   * @param options
   */
  static async importRoot(options: TypeOrmOptions): Promise<void> {
    const dataSource = await createDataSource(options)

    const dataSouceToken = getDataSourceToken(options as DataSourceOptions)
    container.bind<DataSource>(dataSouceToken).toConstantValue(dataSource)

    const entityManagerToken = getEntityManagerToken(options as DataSourceOptions)
    container.bind<EntityManager>(entityManagerToken).toConstantValue(dataSource.manager)
  }

  /**
   * Binds the repository for each entity in `entities` to the container.
   * @param entities
   * @param dataSource
   */
  static async importRepository(
    entities: EntityClassOrSchema[] = [],
    dataSource: DataSource | DataSourceOptions | string = DEFAULT_DATA_SOURCE_NAME,
  ): Promise<void> {
    const conn = this.getDataSource(dataSource)

    ;(entities || []).forEach((entity: EntityClassOrSchema) => {
      const enitityMetadata = conn.entityMetadatas.find((meta: EntityMetadata) => meta.target === entity)
      const isTreeEntity = typeof enitityMetadata?.treeType !== 'undefined'
      const repository = isTreeEntity
        ? conn.getTreeRepository(entity)
        : conn.options.type === 'mongodb'
        ? conn.getMongoRepository(entity)
        : conn.getRepository(entity)

      const repositoryToken = getRepositoryToken(entity, dataSource)
      container.bind<TypeOrmRepository>(repositoryToken).toConstantValue(repository)
    })
  }

  static async destroyDataSource(
    dataSource: DataSource | DataSourceOptions | string = DEFAULT_DATA_SOURCE_NAME,
  ): Promise<void> {
    const conn = this.getDataSource(dataSource)
    if (conn && conn.isInitialized) {
      await conn.destroy()
    }
  }

  static getDataSource(dataSource: DataSource | DataSourceOptions | string = DEFAULT_DATA_SOURCE_NAME): DataSource {
    const dataSouceToken = getDataSourceToken(dataSource)
    return container.get<DataSource>(dataSouceToken)
  }
}
