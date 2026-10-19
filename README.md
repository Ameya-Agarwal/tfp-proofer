# tfp-proofer

A rule-based proofreader for **The Fine Print Grammar and Style Guide**. It checks spelling and grammar and highlights every breach of the style guide. **No LLMs**: spelling uses Hunspell dictionaries (via `nspell`); everything else is hand-written rules in `src/engine.cjs`.

- **Web app:** `dist/index.html`, one self-contained page. All checking runs in the browser.
- **API:** Cloudflare Pages Functions under `functions/api/`, running the same engine.

## Deploy on Cloudflare Pages

1. Push this repo to GitHub.
2. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → pick the repo.
3. Build command: `npm run build`. Build output directory: `dist`. Node 20 or newer.

Or from the CLI: `npm run build && npx wrangler pages deploy dist`.

Local dev: `npm install`, then `npm run dev` (serves the page and the API).

## API

`POST /api/check`

```json
{ "text": "He bought 5 apples, pears and plums.", "spelling": false, "dialect": "gb", "rules": { "excl-question": true } }
```

- `spelling` (default `false`): turn on dictionary spelling. The first request builds a ~1 MB dictionary, which can exceed the free-plan CPU limit of Pages Functions. Leave it off on the free plan, or use the Workers Paid plan.
- `dialect`: `gb` (default), `us` or `either`.
- `rules`: map of rule id to boolean. Question marks (`excl-question`) are off by default.
- Text is limited to 100,000 characters. `start` and `end` are UTF-16 offsets into the submitted text.

Response: `{ stats, spelling, count, issues: [{ rule, title, category, severity, start, end, text, message, guide, fixes: [{ label, text, start, end }] }] }`.
To apply a fix, replace `text[start:end]` with the fix's `text`.

`GET /api/rules` lists every rule with its id, category, severity and the guide wording it enforces.

## Tests

`npm test` runs the guide's own correct examples (which must raise no notes) and a set of violations (which must be flagged with a fix).

## Layout

```
src/engine.cjs      rule engine (shared by browser and API)
src/app.js          editor UI
src/template.html   page shell and styles
scripts/build.mjs   builds dist/index.html and functions/_lib/dict.js
functions/          Pages Functions (/api/check, /api/rules)
tests/              node:test suite
```
