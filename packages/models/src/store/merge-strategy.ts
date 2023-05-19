import { get, mergeWith, set } from 'lodash/fp'
import { NoCellToUseException, NonExistentException } from '../exceptions'
import { deepForIn } from '../utils'
import type { OutPointString } from './interface'

export abstract class MergeStrategy<S, T = S> {
  abstract merge(object: T, source?: S): T
  abstract findAndUpdate(updateInfo: {
    paths?: string[]
    value: unknown
    outPointStrings: OutPointString[]
    states: Record<OutPointString, S>
    isValueEqual(value: unknown, compare: unknown): boolean
    isSimpleType(value: unknown): boolean
  }): {
    update?: {
      outPointString: OutPointString
      state: S
    }[]
    remove?: OutPointString[]
  }
}

/*
It used to merge states by using the latest strategy.
For example: cell 1 include data: { a: 1 }, it's block number is 1
cell 2 include data: { a: 3 }, it's block number is 2
After merge, it will directly use the block 2 data, so the merged states will be: { a: 3 }
*/
export class UseLatestStrategy<S> extends MergeStrategy<S, S> {
  merge(object: S, _source?: S): S {
    return object
  }

  findAndUpdate(updateInfo: {
    paths?: string[]
    value: unknown
    outPointStrings: OutPointString[]
    states: Record<OutPointString, S>
  }): {
    update?: {
      outPointString: OutPointString
      state: S
    }[]
    remove?: OutPointString[]
  } {
    const lastOutPoint = updateInfo.outPointStrings.at(-1)
    if (!lastOutPoint) throw new NoCellToUseException()
    if (!updateInfo.paths?.length) {
      return {
        update: [
          {
            outPointString: lastOutPoint,
            state: updateInfo.value as S,
          },
        ],
      }
    }
    const updateValueInStates = get([lastOutPoint, ...updateInfo.paths.slice(0, updateInfo.paths.length - 1)])(
      updateInfo.states,
    )
    if (updateValueInStates === undefined) {
      throw new NonExistentException(`${lastOutPoint}:${updateInfo.paths.join('.')}`)
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    updateValueInStates[updateInfo.paths.at(-1)!] = updateInfo.value
    return {
      update: [
        {
          outPointString: lastOutPoint,
          state: updateInfo.states[lastOutPoint],
        },
      ],
    }
  }
}

export class DefaultMergeStrategy<S> extends MergeStrategy<S, S> {
  private defaultMergeWith = mergeWith((objValue, srcValue) => {
    if (Array.isArray(objValue)) {
      return objValue.concat(srcValue)
    }
  })

  merge(object: S, source?: S): S {
    if (source === undefined || source === null) return object
    if (Array.isArray(object)) return object.concat(source) as S
    return this.defaultMergeWith(source, object)
  }

  private findAndUpdateInState(
    paths: string[],
    value: unknown,
    state: S,
  ): {
    removePath?: string[]
    state?: S
  } {
    if (typeof state !== 'object' || state === null || !paths.length)
      return { state: value as S, removePath: Array.isArray(value) ? paths : undefined }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let current: any = state
    for (let idx = 0; idx < paths.length; idx++) {
      if (!(paths[idx] in current)) return {}
      current = current[paths[idx]]
      if (!Array.isArray(current)) continue
      if (idx === paths.length - 1) {
        // need to remove others array, or otherwise they will merge into new mergedState
        return {
          removePath: paths,
          state: set(paths, value)(state),
        }
      }
      // replace current state
      return {
        state: set(paths, value)(state),
      }
    }
    return {
      state: set(paths, value)(state),
    }
  }

  private removeNotMergedState({
    state,
    isValueEqual,
    isSimpleType,
    changedPaths,
    mergedState,
  }: {
    state: S
    changedPaths: string[]
    isValueEqual(value: unknown, compare: unknown): boolean
    isSimpleType(value: unknown): boolean
    mergedState?: S
  }) {
    deepForIn(state, (pathValue, currentPaths) => {
      const valueInMerged = get(currentPaths)(mergedState)
      const isChangedPaths =
        currentPaths.length === changedPaths.length && currentPaths.every((path, idx) => changedPaths[idx] === path)
      if (isValueEqual(pathValue, valueInMerged) || isChangedPaths) {
        return false
      }
      if (isSimpleType(pathValue)) {
        // is simple type and is not in mergedState or changed by current, remove it
        if (currentPaths.length === 1) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          delete (state as any)[currentPaths[0]]
        } else if (currentPaths.length > 1) {
          const lastLevelPath = currentPaths.slice(0, -1)
          const lastLevelPathvalue = get(lastLevelPath)(state)
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          delete lastLevelPathvalue[currentPaths.at(-1)!]
        } else {
          // ignore if root is simple type, no need to handle
        }
        return false
      }
      return true
    })
    return state
  }

  findAndUpdate({
    paths,
    value,
    outPointStrings,
    states,
    isValueEqual,
    isSimpleType,
  }: {
    paths?: string[]
    value: unknown
    outPointStrings: OutPointString[]
    states: Record<OutPointString, S>
    isValueEqual(value: unknown, compare: unknown): boolean
    isSimpleType(value: unknown): boolean
  }): {
    update?: {
      outPointString: OutPointString
      state: S
    }[]
    remove?: OutPointString[]
  } {
    const lastOutPoint = outPointStrings.at(-1)
    if (!lastOutPoint) throw new NoCellToUseException()
    if (!paths || !paths.length) {
      return {
        update: [
          {
            outPointString: lastOutPoint,
            state: value as S,
          },
        ],
        remove: outPointStrings.slice(0, -1),
      }
    }
    const mergedState = outPointStrings.reduce(
      (pre: undefined | S, outPoint) => this.merge(states[outPoint], pre),
      undefined,
    )
    for (let idx = outPointStrings.length - 1; idx >= 0; idx--) {
      const outPointString = outPointStrings[idx]
      const { removePath, state } = this.findAndUpdateInState(paths, value, states[outPointString])
      if (state) {
        if (!removePath || !removePath.length) {
          return {
            update: [
              {
                outPointString,
                state: this.removeNotMergedState({
                  state: state,
                  changedPaths: paths,
                  mergedState,
                  isSimpleType,
                  isValueEqual,
                }),
              },
            ],
          }
        }
        const findRemovePath = removePath.slice(0, -1)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const findLastRemovePath = removePath.at(-1)!
        const afterRemovePaths = outPointStrings
          .slice(0, idx)
          .map((v) => {
            const currentPathValueInState = findRemovePath.length ? get(findRemovePath)(states[v]) : states[v]
            if (currentPathValueInState !== undefined && findLastRemovePath in currentPathValueInState) {
              delete currentPathValueInState[findLastRemovePath]
              return {
                outPointString: v,
                state: states[v],
              }
            }
          })
          .filter(
            (
              v,
            ): v is {
              outPointString: OutPointString
              state: S
            } => !!v,
          )
        return {
          update: [
            ...afterRemovePaths,
            {
              outPointString,
              state,
            },
          ].map((v) => ({
            outPointString: v.outPointString,
            state: this.removeNotMergedState({
              state: v.state,
              changedPaths: paths,
              mergedState,
              isSimpleType,
              isValueEqual,
            }),
          })),
        }
      }
    }
    throw new NonExistentException(`${paths.join('.')}`)
  }
}
