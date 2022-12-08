import { describe, it, expect } from '@jest/globals'
import { Service, container } from '../../src'

class DummyService {}
class NamedService {}

describe(`service decorator`, () => {
  describe(`service decorator`, () => {
    it(`should get a dummy service from the container`, () => {
      Service()(DummyService)
      expect(container.get<DummyService>(DummyService.name)).toBeInstanceOf(DummyService)
    })

    it(`should get a named service from the container`, () => {
      Service('named')(NamedService)
      expect(container.get<NamedService>('named')).toBeInstanceOf(NamedService)
    })
  })
})
