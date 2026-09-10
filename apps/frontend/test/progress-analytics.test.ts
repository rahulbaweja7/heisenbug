import { describe, expect, it, beforeEach } from 'vitest'
import { getSolvedIds, markSolved } from '../src/progress'

describe('browser progress isolation', () => {
  beforeEach(() => localStorage.clear())
  it('stores and reads only the current account namespace', () => {
    markSolved('001')
    expect(getSolvedIds()).toEqual(['001'])
  })
  it('recovers from malformed storage', () => {
    localStorage.setItem('heisenbug:solved', '{bad')
    expect(getSolvedIds()).toEqual([])
  })
})
