import { describe, it, expect } from '@jest/globals'
import { getMetadataArgsStorage } from 'typeorm'

import { Service, KuaiEntity, Location, container } from '../src'

@Service()
class DummyService {}

@Service('Named')
class NamedService {}

@KuaiEntity(Location.Data)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class DummyEntity {}

@KuaiEntity(Location.Witness, 'Named')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class NamedEntity {}

describe(`decorator`, () => {
  describe(`service decorator`, () => {
    it(`should get a right service from the container`, () => {
      expect(container.get<DummyService>(DummyService.name)).toBeInstanceOf(DummyService)
      expect(container.get<NamedService>('Named')).toBeInstanceOf(NamedService)
    })
  })

  describe(`kuai entity decorator`, () => {
    it(`should get a right service from the container`, () => {
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
