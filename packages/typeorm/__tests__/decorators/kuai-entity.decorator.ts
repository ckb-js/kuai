import { describe, it, expect } from '@jest/globals'
import { getMetadataArgsStorage, EntityOptions } from 'typeorm'

import { KuaiEntity, Location } from '../../src'

class DummyEntity {}
class NamedEntity {}

describe(`kuai entity decorator`, () => {
  describe(`Entity has no parameter`, () => {
    it(`should find a dummy entity from the typerom metadata storage`, () => {
      KuaiEntity(Location.Data)(DummyEntity)

      let find = false
      getMetadataArgsStorage().tables.forEach((table) => {
        if (table.name === 'DummyEntity_data') {
          find = true
        }
      })
      expect(find).toBe(true)
    })

    it(`should find a dummy entity from the typerom metadata storage`, () => {
      KuaiEntity(Location.Witness)(DummyEntity)

      let find = false
      getMetadataArgsStorage().tables.forEach((table) => {
        if (table.name === 'DummyEntity_witness') {
          find = true
        }
      })
      expect(find).toBe(true)
    })
  })

  describe(`the first parameter of Entity is string`, () => {
    it(`should find a named entity from the typerom metadata storage`, () => {
      KuaiEntity(Location.Data, 'Named')(NamedEntity)

      let find = false
      getMetadataArgsStorage().tables.forEach((table) => {
        if (table.name === 'Named_data') {
          find = true
        }
      })
      expect(find).toBe(true)
    })

    it(`should find a named entity from the typerom metadata storage`, () => {
      KuaiEntity(Location.Witness, 'Named')(NamedEntity)

      let find = false
      getMetadataArgsStorage().tables.forEach((table) => {
        if (table.name === 'Named_witness') {
          find = true
        }
      })
      expect(find).toBe(true)
    })
  })

  describe(`the first parameter of Entity is EntityOptions`, () => {
    describe(`EntityOptions has the field 'name'`, () => {
      it(`should find a named entity from the typerom metadata storage`, () => {
        const options: EntityOptions = {
          name: 'test',
        }
        KuaiEntity(Location.Data, options)(NamedEntity)

        let find = false
        getMetadataArgsStorage().tables.forEach((table) => {
          if (table.name === 'test_data') {
            find = true
          }
        })
        expect(find).toBe(true)
      })

      it(`should find a named entity from the typerom metadata storage`, () => {
        const options: EntityOptions = {
          name: 'test',
        }
        KuaiEntity(Location.Witness, options)(NamedEntity)

        let find = false
        getMetadataArgsStorage().tables.forEach((table) => {
          console.log(table.name)
          if (table.name === 'test_witness') {
            find = true
          }
        })
        expect(find).toBe(true)
      })
    })

    describe(`EntityOptions does not have the field 'name'`, () => {
      it(`should find a dummy entity from the typerom metadata storage`, () => {
        const options: EntityOptions = {}
        KuaiEntity(Location.Data, options)(DummyEntity)

        let find = false
        getMetadataArgsStorage().tables.forEach((table) => {
          if (table.name === 'DummyEntity_data') {
            find = true
          }
        })
        expect(find).toBe(true)
      })

      it(`should find a dummy entity from the typerom metadata storage`, () => {
        const options: EntityOptions = {}
        KuaiEntity(Location.Witness, options)(DummyEntity)

        let find = false
        getMetadataArgsStorage().tables.forEach((table) => {
          if (table.name === 'DummyEntity_witness') {
            find = true
          }
        })
        expect(find).toBe(true)
      })
    })
  })
})
