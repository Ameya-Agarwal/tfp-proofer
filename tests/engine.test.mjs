import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'module';
const FP = createRequire(import.meta.url)('../src/engine.cjs');

const rules = (t, enabled) => FP.check(t, { enabled }).map(i => i.rule);

test('the guide’s own correct examples raise no style notes', () => {
  const ok = [
    'The class’s results, the cactus’s spines and Jones’s report.',
    'We could speak to Alice, Bob, Charlie, or Dan.',
    'I ran, and hence, I was tired.',
    'He said, ‘We’re trying our best.’',
    '‘There was no evidence,’ the member stated.',
    'The member was confident that ‘there was no evidence’.',
    '‘Is this going on record?’ he asked.',
    'The student indignantly exclaimed, ‘You’re failing me?’ The professor remained impassive.',
    'The academic year 2012–2013 saw 0.2–1.7% carbon.',
    'The verdict was unanimous—guilty.',
    'Mr Smith, Dr Jones, Capt. Hook and Prof. Plum met at NASA.',
    'There was nothing he could do; there were too many issues.'
  ];
  for (const t of ok) assert.deepEqual(rules(t), [], t);
});

test('violations are flagged with a fix', () => {
  const cases = [
    ['In the 1980’s we saw it.', 'apos-decade', '1980s'],
    ['The class’ teacher.', 'apos-singular-s', '’s'],
    ['He said “we are trying our best” and left.', 'quote-double-speech'],
    ['We could speak to Alice, Bob, Charlie or Dan.', 'comma-oxford', ','],
    ['The year 2012-2013 was long.', 'dash-range', '–'],
    ['Mr. Smith left.', 'period-abbr-extra', ''],
    ['Capt Hook left.', 'period-abbr-missing', '.'],
    ['He bought 5 apples.', 'num-small', 'five'],
    ['A total of 12,34,567 votes.', 'num-indian', '1,234,567']
  ];
  for (const [t, rule, fix] of cases) {
    const hit = FP.check(t).find(i => i.rule === rule);
    assert.ok(hit, `${rule} in "${t}"`);
    if (fix !== undefined) assert.ok(hit.fixes.some(f => f.text === fix), `${rule} fix ${fix}`);
  }
});

test('rules can be switched off', () => {
  assert.deepEqual(rules('He bought 5 apples.', { 'num-small': false }), []);
});
