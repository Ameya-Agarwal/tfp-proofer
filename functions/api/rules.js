import { FP, json, CORS } from '../_lib/engine.js';

export const onRequestOptions = () => new Response(null, { status: 204, headers: CORS });

export const onRequestGet = () => json({
  categories: FP.CATS,
  rules: Object.values(FP.RULES).map(r => ({ id: r.id, category: r.cat, severity: r.sev, title: r.title, guide: r.ref, defaultOn: !r.off }))
});
