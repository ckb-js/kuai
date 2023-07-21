import { EntitySchema } from 'typeorm'
import { MysqlConnectionOptions } from 'typeorm/driver/mysql/MysqlConnectionOptions'
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions'

// eslint-disable-next-line @typescript-eslint/ban-types
export type EntityClassOrSchema = Function | EntitySchema

export type DataSourceOptions = MysqlConnectionOptions | PostgresConnectionOptions

export type TypeOrmOptions = {
  /**
   * Number of times to retry connecting
   * Default: 10
   */
  retryAttempts?: number
  /**
   * Interval between connection retry attempts (ms)
   * Default: 3000
   */
  retryInterval?: number
} & Partial<DataSourceOptions>
