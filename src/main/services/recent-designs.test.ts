import path from 'path'
import { describe, expect, test } from 'vitest'

import {
  addRecentDesign,
  forgetRecentDesign,
  MAX_RECENT_DESIGNS,
  readRecentDesigns,
  type RecentDesign
} from './recent-designs'

const at = (name: string): string => path.resolve('/designs', `${name}.design`)

let next = 0
const makeId = (): string => `id-${++next}`

const design = (name: string, openedAt = '2026-11-11T12:00:00.000Z'): Omit<RecentDesign, 'id'> => ({
  path: at(name),
  name,
  openedAt
})

describe('addRecentDesign', () => {
  test('puts the design at the top', () => {
    const list = addRecentDesign(addRecentDesign([], design('a'), makeId), design('b'), makeId)
    expect(list.map((entry) => entry.name)).toEqual(['b', 'a'])
  })

  test('moves a design already in the list to the top, keeping its id', () => {
    const first = addRecentDesign([], design('a'), makeId)
    const id = first[0].id
    const list = addRecentDesign(
      addRecentDesign(first, design('b'), makeId),
      { ...design('a'), name: 'a renamed' },
      makeId
    )
    expect(list.map((entry) => entry.name)).toEqual(['a renamed', 'b'])
    expect(list[0].id).toBe(id)
  })

  test('treats two ways of writing the same path as one file', () => {
    const first = addRecentDesign([], design('a'), makeId)
    const list = addRecentDesign(
      first,
      { ...design('a'), path: path.join('/designs', 'sub', '..', 'a.design') },
      makeId
    )
    expect(list).toHaveLength(1)
  })

  test(`keeps at most ${MAX_RECENT_DESIGNS}, dropping the oldest`, () => {
    let list: RecentDesign[] = []
    for (let index = 0; index < MAX_RECENT_DESIGNS + 2; index++) {
      list = addRecentDesign(list, design(`d${index}`), makeId)
    }
    expect(list).toHaveLength(MAX_RECENT_DESIGNS)
    expect(list[0].name).toBe(`d${MAX_RECENT_DESIGNS + 1}`)
    expect(list.map((entry) => entry.name)).not.toContain('d0')
  })
})

describe('forgetRecentDesign', () => {
  test('removes only that entry', () => {
    const list = addRecentDesign(addRecentDesign([], design('a'), makeId), design('b'), makeId)
    expect(forgetRecentDesign(list, list[1].id).map((entry) => entry.name)).toEqual(['b'])
  })
})

describe('readRecentDesigns', () => {
  test('keeps valid entries and drops anything else from a hand-edited settings file', () => {
    const valid = { id: 'x', ...design('a') }
    expect(
      readRecentDesigns([
        valid,
        { ...valid, path: 'relative/path.design' },
        { ...valid, name: 42 },
        'not an entry',
        null
      ])
    ).toEqual([valid])
    expect(readRecentDesigns('not a list')).toEqual([])
    expect(readRecentDesigns(undefined)).toEqual([])
  })
})
