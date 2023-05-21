import { describe, it, expect } from '@jest/globals'
import { DefaultMergeStrategy, UseLatestStrategy } from '../../src'
import { CantSetValueInSimpleType, NoCellToUseException, NonExistentException } from '../../src/exceptions'
import '../comm-mock'

describe('test use the latest strategy', () => {
  const strategy = new UseLatestStrategy()
  describe('test merge', () => {
    it('merge simple type success', () => {
      expect(strategy.merge(10, 20)).toBe(10)
    })
    it('merge complex type success', () => {
      const obj = { a: 10 }
      expect(strategy.merge(obj, {})).toBe(obj)
    })
  })

  describe('test findAndUpdate', () => {
    describe('test replace root', () => {
      it('find the root cell', () => {
        const outPointString = '0x0-0x0'
        const res = strategy.findAndUpdate({
          value: { a: 10 },
          outPointStrings: [outPointString],
          states: {
            [outPointString]: { a: 20 },
          },
        })
        expect(res.update).toStrictEqual([
          {
            outPointString,
            state: { a: 10 },
          },
        ])
      })
      it('no out point string', () => {
        expect(() =>
          strategy.findAndUpdate({
            value: { a: 10 },
            outPointStrings: [],
            states: {},
          }),
        ).toThrow(new NoCellToUseException())
      })
      it('non exist out point string', () => {
        expect(() =>
          strategy.findAndUpdate({
            value: { a: 10 },
            outPointStrings: ['0x0-0x0'],
            states: {},
          }),
        ).toThrow(new NoCellToUseException())
      })
    })

    describe('test replace one key in state', () => {
      it('can not find the path', () => {
        const outPointString = '0x0-0x0'
        expect(() =>
          strategy.findAndUpdate({
            paths: ['b', 'a'],
            value: { a: 10 },
            outPointStrings: [outPointString],
            states: {
              [outPointString]: { a: 20 },
            },
          }),
        ).toThrow(new NonExistentException(`${outPointString}:${['b', 'a'].join('.')}`))
      })
      it('the set value is a simple type', () => {
        const outPointString = '0x0-0x0'
        expect(() =>
          strategy.findAndUpdate({
            paths: ['a', 'b'],
            value: { c: 10 },
            outPointStrings: [outPointString],
            states: {
              [outPointString]: { a: 20 },
            },
          }),
        ).toThrow(new CantSetValueInSimpleType())
      })
      it('find value type is different with new value', () => {
        const outPointString = '0x0-0x0'
        const res = strategy.findAndUpdate({
          paths: ['a', 'b'],
          value: { c: 10 },
          outPointStrings: [outPointString],
          states: {
            [outPointString]: { a: { b: 10 } },
          },
        })
        expect(res.update).toStrictEqual([
          {
            outPointString,
            state: {
              a: { b: { c: 10 } },
            },
          },
        ])
      })
      it('add key in state', () => {
        const outPointString = '0x0-0x0'
        const res = strategy.findAndUpdate({
          paths: ['c'],
          value: { a: 10 },
          outPointStrings: [outPointString],
          states: {
            [outPointString]: { a: 20 },
          },
        })
        expect(res.update).toStrictEqual([
          {
            outPointString,
            state: {
              a: 20,
              c: { a: 10 },
            },
          },
        ])
      })
    })
  })
})

describe('test the default merge strategy', () => {
  const strategy = new DefaultMergeStrategy()
  describe('test merge', () => {
    it('merge simple type success', () => {
      expect(strategy.merge(10, 20)).toBe(10)
    })
    it('merge complex type success', () => {
      expect(strategy.merge({ a: 10, b: 20 }, { a: 20, c: 30 })).toStrictEqual({ a: 10, b: 20, c: 30 })
    })
    it('merge with root array', () => {
      expect(strategy.merge([1, 2, 3], [2, 3])).toStrictEqual([1, 2, 3, 2, 3])
    })
    it('merge with array', () => {
      expect(strategy.merge({ a: [1, 2, 3] }, { a: [2, 3] })).toStrictEqual({ a: [1, 2, 3, 2, 3] })
    })
    it('merge with array if old value is not array', () => {
      expect(strategy.merge({ a: [1, 2, 3] }, { a: 10 })).toStrictEqual({ a: [1, 2, 3] })
    })
  })

  describe('test find and update', () => {
    describe('test update root', () => {
      it('no outpint string', () => {
        expect(() =>
          strategy.findAndUpdate({
            outPointStrings: [],
            states: { a: 10 },
            value: { a: 20 },
          }),
        ).toThrow(new NoCellToUseException())
      })
      it('can not find the outpoint string', () => {
        expect(() =>
          strategy.findAndUpdate({
            outPointStrings: [`0x${'0'.repeat(64)}`],
            states: { a: 10 },
            value: { a: 20 },
          }),
        ).toThrow(new NoCellToUseException())
      })
      it('find and update root', () => {
        const outPointString = `0x${'0'.repeat(64)}_0x01`
        const res = strategy.findAndUpdate({
          outPointStrings: [outPointString],
          states: {
            [outPointString]: { a: 10 },
          },
          value: { a: 20 },
        })
        expect(res).toStrictEqual({
          update: [
            {
              outPointString,
              state: { a: 20 },
            },
          ],
          remove: [],
        })
      })
    })

    describe('test update key in state', () => {
      describe('only one key in state', () => {
        const outPointString = `0x${'0'.repeat(64)}_0x01`
        const states = {
          [outPointString]: { a: 10, b: [1, 2, 3], c: [{ c1: 'c1' }, { c2: 'c2' }] },
        }

        it('find and replace', () => {
          const res = strategy.findAndUpdate({
            outPointStrings: [outPointString],
            states,
            paths: ['a'],
            value: 20,
          })
          expect(res.update).toStrictEqual([
            {
              outPointString,
              state: { ...states[outPointString], a: 20 },
            },
          ])
          expect(res.remove).toBeUndefined()
        })

        it('can not find the key', () => {
          expect(() =>
            strategy.findAndUpdate({
              outPointStrings: [outPointString],
              states,
              paths: ['a', 'b'],
              value: 20,
            }),
          ).toThrow(new NonExistentException(`${['a', 'b'].join('.')}`))
        })

        it('replace array', () => {
          const res = strategy.findAndUpdate({
            outPointStrings: [outPointString],
            states,
            paths: ['b'],
            value: [2, 3, 4],
          })
          expect(res.update).toStrictEqual([
            {
              outPointString,
              state: { ...states[outPointString], b: [2, 3, 4] },
            },
          ])
          expect(res.remove).toBeUndefined()
        })

        it('replace in array', () => {
          const res = strategy.findAndUpdate({
            outPointStrings: [outPointString],
            states,
            paths: ['c', '0', 'c1'],
            value: 'c11',
          })
          expect(res.update).toStrictEqual([
            {
              outPointString,
              state: { ...states[outPointString], c: [{ c1: 'c11' }, { c2: 'c2' }] },
            },
          ])
          expect(res.remove).toBeUndefined()
        })
      })

      describe('multi keys in state', () => {
        const outPointString1 = `0x${'0'.repeat(64)}_0x00`
        const outPointString2 = `0x${'0'.repeat(64)}_0x01`
        const states = {
          [outPointString1]: { a: 10, b: [1, 2, 3], c: [{ c1: 'c1' }, { c2: 'c2' }], e: 'e1' },
          [outPointString2]: { a: 20, b: [4, 5, 6], c: [{ c1: 'c1' }, { c2: 'c2' }], f: 'f1' },
        }

        it('replace key in some state', () => {
          const res = strategy.findAndUpdate({
            outPointStrings: [outPointString1, outPointString2],
            paths: ['a'],
            value: 30,
            states,
          })
          expect(res.update).toStrictEqual([
            {
              outPointString: outPointString2,
              state: { ...states[outPointString2], a: 30 },
            },
          ])
        })

        it('replace key in first state', () => {
          const res = strategy.findAndUpdate({
            outPointStrings: [outPointString1, outPointString2],
            paths: ['e'],
            value: 'e2',
            states,
          })
          expect(res.update).toStrictEqual([
            {
              outPointString: outPointString1,
              state: { b: [1, 2, 3], c: [{ c1: 'c1' }, { c2: 'c2' }], e: 'e2' },
            },
          ])
        })

        it('update array', () => {
          const res = strategy.findAndUpdate({
            outPointStrings: [outPointString1, outPointString2],
            paths: ['b'],
            value: [0, 1, 2, 3],
            states,
          })
          const outPointString1State = { ...states[outPointString1] }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (outPointString1State as any)['b']
          expect(res.update).toStrictEqual([
            {
              outPointString: outPointString1,
              state: outPointString1State,
            },
            {
              outPointString: outPointString2,
              state: { ...states[outPointString2], b: [0, 1, 2, 3] },
            },
          ])
        })
      })
    })
  })
})
