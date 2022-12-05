import { DataSourceOptions } from 'typeorm'

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
  /**
   * Function that determines whether the module should
   * attempt to connect upon failure.
   *
   * @param err error that was thrown
   * @returns whether to retry connection or not
   */
  shouldRetry?: (err: unknown) => boolean
} & Partial<DataSourceOptions>
