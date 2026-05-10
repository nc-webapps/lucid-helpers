import { test } from 'node:test'
import * as assert from 'node:assert/strict'
import { numericColumn } from '../src/index.js'

test('numericColumn.consume — decimal-string hydration coerces to JS number', () => {
  const result = numericColumn.consume('100.50')
  assert.equal(typeof result, 'number')
  assert.equal(result, 100.5)
  assert.ok(!Number.isNaN(result as number))
})

test('numericColumn.consume — null is preserved (not 0, not NaN)', () => {
  const result = numericColumn.consume(null)
  assert.equal(result, null)
})

test('numericColumn.consume — integer no-op + string "0" coerces to 0', () => {
  assert.equal(numericColumn.consume(42), 42)
  assert.equal(typeof numericColumn.consume(42), 'number')
  assert.equal(numericColumn.consume('0'), 0)
  assert.equal(typeof numericColumn.consume('0'), 'number')
})
