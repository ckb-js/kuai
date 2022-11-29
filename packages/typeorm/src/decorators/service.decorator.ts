import { injectable } from 'inversify'
import { container } from '../typeorm.manager'

export const Service =
  (name?: string) =>
  (cls: new (...args: never[]) => unknown): void => {
    injectable()(cls)
    if (name) {
      container.bind(name).to(cls)
    } else {
      container.bind(cls.name).to(cls)
    }
  }
