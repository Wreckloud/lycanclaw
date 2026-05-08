import test from 'node:test'
import assert from 'node:assert/strict'
import {
  parseWalineRecentCommentsResponse,
  parseWalineCommentCountResponse,
  parseWalinePageViewResponse
} from '../docs/.vitepress/theme/utils/apiResponseParsers.js'

test('parseWalineRecentCommentsResponse supports array and envelope', () => {
  const sample = [{ objectId: '1' }, { objectId: '2' }]
  assert.deepEqual(parseWalineRecentCommentsResponse(sample), sample)
  assert.deepEqual(
    parseWalineRecentCommentsResponse({ errno: 0, data: sample }),
    sample
  )
  assert.deepEqual(parseWalineRecentCommentsResponse({}), [])
})

test('parseWalineCommentCountResponse resolves multiple response shapes', () => {
  assert.equal(parseWalineCommentCountResponse(5, '/foo/bar'), 5)
  assert.equal(
    parseWalineCommentCountResponse({ errno: 0, data: 8 }, '/foo/bar'),
    8
  )
  assert.equal(
    parseWalineCommentCountResponse({ '/foo/bar': 3 }, '/foo/bar'),
    3
  )
  assert.equal(parseWalineCommentCountResponse({ 'foo/bar': 4 }, '/foo/bar'), 4)
  assert.equal(parseWalineCommentCountResponse({}, '/foo/bar'), 0)
})

test('parseWalinePageViewResponse returns numeric count only', () => {
  assert.equal(parseWalinePageViewResponse(12), 12)
  assert.equal(parseWalinePageViewResponse({ data: 12 }), 0)
  assert.equal(parseWalinePageViewResponse(null), 0)
})
