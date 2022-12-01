import { describe, it, expect } from '@jest/globals'
import { getMetadataArgsStorage } from 'typeorm'

import { Service, KuaiEntity, Location, container } from '../src'

class DummyService {}
class NamedService {}
class DummyEntity {}
class NamedEntity {}

describe(`decorator`, () => {
  describe(`service decorator`, () => {
    it(`should get a right service from the container`, () => {
      Service()(DummyService)
      Service('Named')(NamedService)

      expect(container.get<DummyService>(DummyService.name)).toBeInstanceOf(DummyService)
      expect(container.get<NamedService>('Named')).toBeInstanceOf(NamedService)
    })
  })

  describe(`kuai entity decorator`, () => {
    it(`should find a right entity from the typerom metadata storage`, () => {
      KuaiEntity(Location.Data)(DummyEntity)
      KuaiEntity(Location.Witness, 'Named')(NamedEntity)

      let findDummyEntity = false
      let findNamedEntity = false

      getMetadataArgsStorage().tables.forEach((table) => {
        if (table.name! == 'DummyEntity_data') {
          findDummyEntity = true
        }
        if (table.name! == 'Named_witness') {
          findNamedEntity = true
        }
      })

      expect(findDummyEntity).toBe(true)
      expect(findNamedEntity).toBe(true)
    })
  })
})
