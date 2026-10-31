export const entryId = (value) => String(value ?? '').trim();

export const isSameEntryId = (left, right) => {
  const leftId = entryId(left);
  return Boolean(leftId) && leftId === entryId(right);
};

export const hasEntryId = (ids, id) => ids.some(candidate => isSameEntryId(candidate, id));

const parseDrawKey = (key) => {
  const parts = String(key).split('-');
  const event = parts.pop() || '';
  const gender = parts.pop() || '';
  return { department: parts.join('-'), gender, event };
};

const isRelayEvent = (event) => String(event || '').includes('R')
  || String(event || '').includes('リレー')
  || String(event || '').includes('駅伝');

/**
 * 削除したエントリーに紐づく組割り・結果だけを取り除く。
 * 個人とリレーの旧IDが偶然同じ場合でも、種目区分の異なるデータは残す。
 */
export const removeDeletedEntryReferences = ({ entries, entryType, draws, results }) => {
  const removedIds = new Set((entries || []).map(entry => entryId(entry?.id)).filter(Boolean));
  const isDeletedEntry = (drawKey, id) => {
    const isRelayDraw = isRelayEvent(parseDrawKey(drawKey).event);
    return isRelayDraw === (entryType === 'relay') && removedIds.has(entryId(id));
  };

  const nextDraws = { ...(draws || {}) };
  Object.entries(draws || {}).forEach(([key, races]) => {
    if (!Array.isArray(races)) return;
    let drawChanged = false;
    const remainingRaces = races.map(race => {
      const lanes = Array.isArray(race?.lanes) ? race.lanes : [];
      const remainingLanes = lanes.filter(item => !isDeletedEntry(key, item?.athlete?.id));
      if (remainingLanes.length === lanes.length) return race;
      drawChanged = true;
      return remainingLanes.length ? { ...race, lanes: remainingLanes } : null;
    }).filter(Boolean);
    if (!drawChanged) return;
    if (remainingRaces.length) nextDraws[key] = remainingRaces;
    else delete nextDraws[key];
  });

  const nextResults = { ...(results || {}) };
  Object.entries(results || {}).forEach(([raceKey, raceResults]) => {
    if (!Array.isArray(raceResults)) return;
    const drawKey = String(raceKey).replace(/-\d+$/, '');
    const remainingResults = raceResults.filter(result => !isDeletedEntry(drawKey, result?.athleteId));
    if (remainingResults.length === raceResults.length) return;
    if (remainingResults.length) nextResults[raceKey] = remainingResults;
    else delete nextResults[raceKey];
  });

  return { draws: nextDraws, results: nextResults };
};
