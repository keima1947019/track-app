import assert from 'node:assert/strict';
import test from 'node:test';
import {
  entryId,
  hasEntryId,
  isSameEntryId,
  removeDeletedEntryReferences
} from '../src/entryDeletion.mjs';

test('IDの型が異なっても同一エントリーとして比較できる', () => {
  assert.equal(entryId(42), '42');
  assert.equal(isSameEntryId(42, '42'), true);
  assert.equal(isSameEntryId('', ''), false);
  assert.equal(hasEntryId(['42'], 42), true);
});

test('個人エントリー削除は数値・文字列IDが混在しても関連する組割りと結果を削除する', () => {
  const state = {
    draws: {
      '一般-男子-100m': [{ raceNumber: 1, lanes: [{ athlete: { id: 42 } }, { athlete: { id: '43' } }] }]
    },
    results: {
      '一般-男子-100m-1': [{ athleteId: '42', rank: 1 }, { athleteId: 43, rank: 2 }]
    }
  };

  const next = removeDeletedEntryReferences({
    entries: [{ id: '42' }],
    entryType: 'individual',
    ...state
  });

  assert.deepEqual(next.draws['一般-男子-100m'][0].lanes.map(lane => lane.athlete.id), ['43']);
  assert.deepEqual(next.results['一般-男子-100m-1'].map(result => result.athleteId), [43]);
  assert.equal(state.draws['一般-男子-100m'][0].lanes.length, 2, '元のstateは変更しない');
});

test('同じ旧IDのリレー組割り・結果は個人削除では残す', () => {
  const state = {
    draws: {
      '一般-男子-100m': [{ raceNumber: 1, lanes: [{ athlete: { id: '7' } }] }],
      '一般-男子-4×100mR': [{ raceNumber: 1, lanes: [{ athlete: { id: 7 } }] }]
    },
    results: {
      '一般-男子-100m-1': [{ athleteId: 7 }],
      '一般-男子-4×100mR-1': [{ athleteId: '7' }]
    }
  };

  const next = removeDeletedEntryReferences({
    entries: [{ id: 7 }],
    entryType: 'individual',
    ...state
  });

  assert.equal(next.draws['一般-男子-100m'], undefined);
  assert.equal(next.results['一般-男子-100m-1'], undefined);
  assert.equal(next.draws['一般-男子-4×100mR'][0].lanes.length, 1);
  assert.equal(next.results['一般-男子-4×100mR-1'].length, 1);
});

test('リレーチーム削除は同じIDの個人データを残す', () => {
  const state = {
    draws: {
      '一般-男子-100m': [{ raceNumber: 1, lanes: [{ athlete: { id: '12' } }] }],
      '一般-男子-4×400mR': [{ raceNumber: 1, lanes: [{ athlete: { id: 12 } }] }]
    },
    results: {
      '一般-男子-100m-1': [{ athleteId: 12 }],
      '一般-男子-4×400mR-1': [{ athleteId: '12' }]
    }
  };

  const next = removeDeletedEntryReferences({
    entries: [{ id: '12' }],
    entryType: 'relay',
    ...state
  });

  assert.equal(next.draws['一般-男子-4×400mR'], undefined);
  assert.equal(next.results['一般-男子-4×400mR-1'], undefined);
  assert.equal(next.draws['一般-男子-100m'][0].lanes.length, 1);
  assert.equal(next.results['一般-男子-100m-1'].length, 1);
});
