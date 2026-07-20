import { describe, expect, it } from 'vitest'
import { assertNever } from './assert-never'

describe('assertNever', () => {
  it('throws for unexpected values', () => {
    expect(() => assertNever('unexpected' as never)).toThrow(/Unexpected value/)
  })
})
