import assert from 'node:assert/strict';
import test from 'node:test';
import { HttpError } from '../../src/errors/httpError.js';
import { parseEmptyQuery, parseStreamQuery } from '../../src/transport/queryParams.js';

test('parseStreamQuery accepts a valid sinceTick query', () => {
  assert.deepEqual(parseStreamQuery({ sinceTick: '12' }), { sinceTick: 12 });
});

test('parseStreamQuery rejects invalid sinceTick values', () => {
  assert.throws(() => parseStreamQuery({ sinceTick: '-1' }), (error: unknown) => {
    assert.ok(error instanceof HttpError);
    assert.equal(error.statusCode, 400);
    return true;
  });
});

test('parseEmptyQuery rejects unexpected query parameters', () => {
  assert.throws(() => parseEmptyQuery({ extra: 'value' }), (error: unknown) => {
    assert.ok(error instanceof HttpError);
    assert.equal(error.statusCode, 400);
    return true;
  });
});
