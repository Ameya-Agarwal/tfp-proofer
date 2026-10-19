import { FP, spellFn, json, CORS } from '../_lib/engine.js';

const MAX_CHARS = 100000;

export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });

// POST /api/check
// { "text": "...", "spelling": false, "dialect": "gb" | "us" | "either", "rules": { "excl-question": true, "comma-oxford": false } }
export async function onRequestPost({ request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Body must be JSON.' }, 400); }
  if (typeof body.text !== 'string') return json({ error: '"text" must be a string.' }, 400);
  if (body.text.length > MAX_CHARS) return json({ error: `Text is limited to ${MAX_CHARS} characters.` }, 413);

  const dialect = ['gb', 'us', 'either'].includes(body.dialect) ? body.dialect : 'gb';
  // Spelling builds a ~1 MB dictionary on a cold start. That can exceed the free-plan CPU limit, so it is opt-in.
  const spell = body.spelling ? spellFn(dialect) : null;
  const rules = body.rules && typeof body.rules === 'object' ? body.rules : {};

  const issues = FP.check(body.text, { enabled: rules, spell }).map(i => ({
    rule: i.rule,
    title: FP.RULES[i.rule].title,
    category: i.cat,
    severity: i.sev,
    start: i.start,
    end: i.end,
    text: i.text,
    message: i.msg,
    guide: FP.RULES[i.rule].ref,
    fixes: i.fixes.map(f => ({ label: f.label, text: f.text, start: f.start, end: f.end }))
  }));
  return json({ stats: FP.stats(body.text), spelling: !!spell, count: issues.length, issues });
}

export const onRequestGet = () => json({
  usage: 'POST JSON { text, spelling?, dialect?, rules? } to this endpoint. GET /api/rules lists rule ids.',
  note: 'Offsets are UTF-16 code-unit indexes into the submitted text.'
});
