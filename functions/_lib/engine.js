import FP from '../../src/engine.cjs';
import nspell from 'nspell';
import DICT from './dict.js';

const spellers = {};
function speller(d) {
  if (!spellers[d]) spellers[d] = nspell({ aff: DICT[d].aff, dic: DICT[d].dic });
  return spellers[d];
}

export function spellFn(dialect) {
  if (dialect === 'either') { const a = speller('gb'), b = speller('us'); return w => a.correct(w) || b.correct(w); }
  const s = speller(dialect === 'us' ? 'us' : 'gb');
  return w => s.correct(w);
}

export { FP };

export const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
  'access-control-allow-headers': 'content-type'
};

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...CORS } });
}
