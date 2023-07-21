import { describe, it, expect } from '@jest/globals'
import { extractJsonFromString } from '../src/util/json'

describe('Test extract json', () => {
  it('extract object json', async () => {
    const text = `
    some before text...
    {
      "name": "test",
    }
    some after text...
    `

    const result = extractJsonFromString(text)
    expect(result.length).toEqual(1)
    expect(result[0]).toEqual({
      name: 'test',
    })
  })

  it('extract array json', async () => {
    const text = `
    some before text...
    [
      {
      "name": "test",
      },
      {
        "name": "test2",
      }
    ]
    some after text...
    `

    const result = extractJsonFromString(text)
    expect(result.length).toEqual(1)
    expect(result[0]).toEqual([{ name: 'test' }, { name: 'test2' }])
  })

  it('extract multiple json', async () => {
    const text = `
    some before text...
    {
    "name": "test",
    }
    some text in middle...
    {
      "name": "test2",
    }
    some after text...
    `

    const result = extractJsonFromString(text)
    expect(result.length).toEqual(2)
    expect(result[0]).toEqual({ name: 'test' })
    expect(result[1]).toEqual({ name: 'test2' })
  })

  describe('Test extract invalid json', () => {
    it('unquoted case', async () => {
      const text = `
        some before text...
        {
          name: "test",
        }
        some after text...
      `

      const result = extractJsonFromString(text)
      expect(result.length).toEqual(1)
      expect(result[0]).toEqual({ name: 'test' })
    })

    it('unquoted & value contains a colon case', async () => {
      const text = `
        some before text...
        {
          name: "test:test",
        }
        some after text...
      `

      const result = extractJsonFromString(text)
      expect(result.length).toEqual(1)
      expect(result[0]).toEqual({ name: 'test:test' })
    })
  })
})
