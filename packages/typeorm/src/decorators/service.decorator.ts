import { injectable } from 'inversify'
import { container } from '../typeorm.manager'

export const Service =
  (name?: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (cls: new (...args: any[]) => unknown): void => {
    injectable()(cls)
    container.bind(name || cls.name).to(cls)
  }
