(function () {
  'use strict';
  var FP = window.FP;
  var $ = function (s) { return document.querySelector(s); };
  var ed = $('#ed'), layer = $('#layer'), notesEl = $('#notes'), chipsEl = $('#chips'), countEl = $('#count'),
    loadEl = $('#loadbar'), statsEl = $('#stats'), rulesPane = $('#pane-rules'), notesPane = $('#pane-notes'),
    undoBtn = $('#btn-undo'), toastEl = $('#toast');

  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  var SAMPLE = [
    'Orientation Week Recap.',
    '',
    'The club’s annual fest was a success. Over 12000 people attended and the crowd was bigger then expected, but the sound crew couldnt keep up. Jones\' team handled the lights; the sound crew handled the rest.',
    '',
    'The convenor said "we are trying our best" and left the room. \'There was no evidence\', the member stated. Was this the best option? Nobody knew!',
    '',
    'Registrations ran from 2-9 October, and stalls were open between 10am - 6pm. Volunteers included Alice, Bob and Charlie. We ordered twenty-five chairs, 3 tables and an extra projector... it was a expensive night. The 1980\'s theme was popular, and every one agreed its an event to repeat. Contact the secretary by e-mail or visit the U.S.A. desk. Mr. Rao thanked Capt Verma and the the volunteers (who had worked since morning).'
  ].join('\n');

  var ORDER = { error: 3, style: 2, hint: 1 };
  var SEV_LABEL = { error: 'Mistake', style: 'Style guide', hint: 'Consider' };

  var state = {
    rules: LS.get('fp-rules', {}),
    dialect: LS.get('fp-dialect', 'gb'),
    ignored: LS.get('fp-ignored', []),
    words: LS.get('fp-words', []),
    hidden: {},
    issues: [], sel: -1, undo: [], limit: 120,
    ready: false, loading: false
  };
  var spellers = {};
  var sug = {};
  var sugGen = 0;

  /* ---------- dictionary ---------- */
  function build(d) {
    if (!spellers[d]) { var D = window.FP_DICT[d]; spellers[d] = window.nspell({ aff: D.aff, dic: D.dic }); }
    return spellers[d];
  }
  function spellFn() {
    if (!state.ready) return null;
    if (state.dialect === 'either') { var a = build('gb'), b = build('us'); return function (w) { return a.correct(w) || b.correct(w); }; }
    var s = build(state.dialect);
    return function (w) { return s.correct(w); };
  }
  function suggestWords(word) {
    var out = [];
    var ds = state.dialect === 'either' ? ['gb', 'us'] : [state.dialect];
    ds.forEach(function (d) { build(d).suggest(word).forEach(function (w) { if (out.indexOf(w) < 0) out.push(w); }); });
    return out.slice(0, 5);
  }
  function loadDict() {
    state.ready = false; state.loading = true; renderLoad();
    setTimeout(function () {
      try {
        if (state.dialect === 'either') { build('gb'); build('us'); } else build(state.dialect);
        state.ready = true;
      } catch (e) { state.ready = false; }
      state.loading = false;
      sug = {};
      run();
    }, 40);
  }

  /* ---------- checking ---------- */
  function ignoredMap() { var o = {}; state.words.forEach(function (w) { o[w] = 1; }); return o; }
  function ignKey(it) { return it.rule + '|' + it.text.toLowerCase(); }
  var runTimer = 0;
  function schedule() {
    var n = ed.value.length;
    if (n < 30000) { run(); return; }
    clearTimeout(runTimer); runTimer = setTimeout(run, 350);
  }
  function run() {
    var t = ed.value;
    var ign = {}; state.ignored.forEach(function (k) { ign[k] = 1; });
    var res = FP.check(t, { enabled: state.rules, spell: spellFn(), ignore: ignoredMap() });
    res = res.filter(function (it) { return !ign[ignKey(it)]; });
    res.forEach(function (it, i) {
      it.id = i;
      if (it.end === it.start) {
        var m = /[A-Za-z0-9’']+$/.exec(t.slice(Math.max(0, it.start - 30), it.start));
        it.hs = it.start - (m ? m[0].length : 1); it.he = it.start;
        if (it.hs < 0) it.hs = 0;
      } else { it.hs = it.start; it.he = it.end; }
    });
    state.issues = res;
    if (state.sel >= res.length) state.sel = -1;
    fit();
    renderLayer();
    renderSummary();
    renderNotes();
    var st = FP.stats(t);
    statsEl.textContent = st.words.toLocaleString('en-US') + ' words · ' + st.sentences.toLocaleString('en-US') + ' sentences';
    LS.set('fp-text', t);
  }

  /* ---------- rendering ---------- */
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function visible() { return state.issues.filter(function (i) { return !state.hidden[i.cat]; }); }

  function fit() {
    ed.style.height = 'auto';
    var h = Math.max(ed.scrollHeight, 420);
    ed.style.height = h + 'px';
    layer.style.minHeight = h + 'px';
  }

  function renderLayer() {
    var t = ed.value, vis = visible();
    var pts = { 0: 1 }; pts[t.length] = 1;
    vis.forEach(function (i) { pts[i.hs] = 1; pts[i.he] = 1; });
    var b = Object.keys(pts).map(Number).sort(function (x, y) { return x - y; });
    var html = '';
    for (var k = 0; k < b.length - 1; k++) {
      var a = b[k], z = b[k + 1];
      if (z <= a) continue;
      var top = null;
      for (var j = 0; j < vis.length; j++) {
        var it = vis[j];
        if (it.hs <= a && it.he >= z) {
          if (!top || ORDER[it.sev] > ORDER[top.sev] || (ORDER[it.sev] === ORDER[top.sev] && (it.he - it.hs) < (top.he - top.hs))) top = it;
        }
      }
      var seg = esc(t.slice(a, z));
      if (top) {
        var sel = false;
        for (var q = 0; q < vis.length; q++) if (vis[q].id === state.sel && vis[q].hs <= a && vis[q].he >= z) sel = true;
        html += '<mark class="m-' + top.sev + (sel ? ' sel' : '') + '" data-i="' + top.id + '">' + seg + '</mark>';
      } else html += seg;
    }
    layer.innerHTML = html + '\n ';
  }

  function renderLoad() {
    loadEl.textContent = state.loading ? 'Loading the spelling dictionary…' : '';
  }

  function renderSummary() {
    var n = state.issues.length;
    var errs = state.issues.filter(function (i) { return i.sev === 'error'; }).length;
    countEl.innerHTML = n + '<small>' + (n === 1 ? 'note' : 'notes') + (n ? ' · ' + errs + ' ' + (errs === 1 ? 'mistake' : 'mistakes') : '') + '</small>';
    renderLoad();
    var counts = {}, sevOf = {};
    state.issues.forEach(function (i) { counts[i.cat] = (counts[i.cat] || 0) + 1; var o = sevOf[i.cat]; if (!o || ORDER[i.sev] > ORDER[o]) sevOf[i.cat] = i.sev; });
    var html = '';
    FP.CATS.forEach(function (c) {
      if (!counts[c.id]) return;
      html += '<button type="button" class="chip" data-cat="' + c.id + '" data-sev="' + sevOf[c.id] + '" aria-pressed="' + (!state.hidden[c.id]) + '"><i></i>' + esc(c.label) + ' <b>' + counts[c.id] + '</b></button>';
    });
    chipsEl.innerHTML = html;
  }

  function catLabel(id) { for (var i = 0; i < FP.CATS.length; i++) if (FP.CATS[i].id === id) return FP.CATS[i].label; return id; }

  function fixesOf(it) {
    if (it.rule !== 'spelling') return it.fixes;
    var list = sug[it.word];
    if (!list) return null;
    return list.map(function (w) {
      w = w.replace(/'/g, '’');
      if (/^[A-Z]/.test(it.text) && !/^[A-Z]/.test(w)) w = w.charAt(0).toUpperCase() + w.slice(1);
      return { label: w, text: w, start: it.start, end: it.end };
    });
  }

  function noteHTML(it) {
    var fx = fixesOf(it), fh = '';
    if (fx === null) fh = '<span class="arrow">…</span>';
    else if (fx.length) fx.forEach(function (f, fi) { fh += '<button type="button" class="fix" data-act="fix" data-i="' + it.id + '" data-f="' + fi + '" title="' + esc(f.text === '' ? 'Delete' : f.text) + '">' + esc(f.label) + '</button>'; });
    else if (it.rule === 'spelling') fh = '<span class="arrow">no suggestions</span>';
    var raw = it.text.length > 70 ? it.text.slice(0, 68) + '…' : it.text;
    if (it.start === it.end) raw = '';
    var was = it.start === it.end ? '' : '<span class="was' + (fx && fx.length ? '' : ' plain') + '">' + esc(raw) + '</span>' + (fx && fx.length ? '<span class="arrow">→</span>' : '');
    var sel = it.id === state.sel;
    var r = FP.RULES[it.rule];
    var h = '<article class="note sev-' + it.sev + (sel ? ' sel' : '') + '" data-i="' + it.id + '" tabindex="0" aria-label="' + esc(r.title) + '">';
    h += '<div class="note-head"><span class="tag"><i></i>' + esc(catLabel(it.cat)) + '</span><span class="rule">' + esc(r.title) + '</span></div>';
    h += '<div class="snip">' + was + fh + '</div>';
    h += '<p class="msg">' + esc(it.msg) + '</p>';
    if (sel) {
      h += '<blockquote class="ref"><b>' + (r.cat === 'spelling' || r.cat === 'grammar' || r.cat === 'spacing' ? 'About this check' : 'Fine Print guide') + '</b>' + esc(r.ref) + '</blockquote>';
      h += '<div class="note-foot">' + (it.rule === 'spelling'
        ? '<button type="button" class="linkbtn" data-act="dict" data-i="' + it.id + '">Add “' + esc(it.word) + '” to my dictionary</button>'
        : '<button type="button" class="linkbtn" data-act="ignore" data-i="' + it.id + '">Ignore this wherever it appears</button>') + '</div>';
    }
    return h + '</article>';
  }

  function renderNotes() {
    var vis = visible();
    if (!ed.value.trim()) {
      notesEl.innerHTML = '<div class="empty"><strong>Nothing to check yet</strong>Paste text into the sheet, or load the sample to see each rule at work.</div>';
      return;
    }
    if (!vis.length) {
      notesEl.innerHTML = '<div class="empty"><strong>' + (state.issues.length ? 'All notes are filtered out' : 'No notes') + '</strong>' + (state.issues.length ? 'Turn a category back on with the chips above.' : 'Nothing here breaks the rules this tool knows about.') + '</div>';
      return;
    }
    var h = '';
    var shown = vis.slice(0, state.limit);
    shown.forEach(function (it) { h += noteHTML(it); });
    if (vis.length > shown.length) h += '<div class="more"><button type="button" class="btn" data-act="more">Show ' + Math.min(120, vis.length - shown.length) + ' more</button></div>';
    notesEl.innerHTML = h;
    queueSuggestions(shown);
  }

  function updateNote(id) {
    var el = notesEl.querySelector('.note[data-i="' + id + '"]');
    var it = state.issues[id];
    if (!el || !it) return;
    var tmp = document.createElement('div');
    tmp.innerHTML = noteHTML(it);
    el.replaceWith(tmp.firstChild);
  }

  /* spelling suggestions are computed one word per tick so typing stays smooth */
  function queueSuggestions(list) {
    var gen = ++sugGen;
    var todo = list.filter(function (i) { return i.rule === 'spelling' && !sug[i.word]; });
    if (state.sel >= 0 && state.issues[state.sel] && state.issues[state.sel].rule === 'spelling' && !sug[state.issues[state.sel].word]) todo.unshift(state.issues[state.sel]);
    (function step() {
      if (gen !== sugGen || !todo.length || !state.ready) return;
      var it = todo.shift();
      if (!sug[it.word]) { try { sug[it.word] = suggestWords(it.word); } catch (e) { sug[it.word] = []; } }
      state.issues.forEach(function (o) { if (o.rule === 'spelling' && o.word === it.word) updateNote(o.id); });
      setTimeout(step, 0);
    })();
  }

  /* ---------- selection ---------- */
  function select(id, from) {
    state.sel = id;
    renderLayer();
    var prev = notesEl.querySelector('.note.sel');
    if (prev) { var pid = +prev.getAttribute('data-i'); prev.classList.remove('sel'); updateNote(pid); }
    var it = state.issues[id];
    if (!it) return;
    updateNote(id);
    if (it.rule === 'spelling' && !sug[it.word] && state.ready) queueSuggestions([it]);
    var el = notesEl.querySelector('.note[data-i="' + id + '"]');
    if (from === 'text' && el) el.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    if (from === 'note') {
      ed.focus({ preventScroll: true });
      try { ed.setSelectionRange(it.start, it.end); } catch (e) { /* ignore */ }
      var mk = layer.querySelector('mark.sel') || layer.querySelector('mark[data-i="' + id + '"]');
      if (mk) {
        var r = mk.getBoundingClientRect();
        if (r.top < 90 || r.bottom > window.innerHeight - 90) window.scrollBy({ top: r.top - window.innerHeight / 3, behavior: 'auto' });
      }
    }
  }
  function selectByCaret() {
    var pos = ed.selectionStart, best = null;
    visible().forEach(function (it) {
      if (it.hs <= pos && pos <= it.he) {
        if (!best || ORDER[it.sev] > ORDER[best.sev] || (ORDER[it.sev] === ORDER[best.sev] && it.he - it.hs < best.he - best.hs)) best = it;
      }
    });
    if (best && best.id !== state.sel) select(best.id, 'text');
    else if (!best && state.sel !== -1) { state.sel = -1; renderLayer(); renderNotes(); }
  }

  /* ---------- editing ---------- */
  function pushUndo() { state.undo.push({ v: ed.value, c: ed.selectionStart }); if (state.undo.length > 60) state.undo.shift(); undoBtn.disabled = false; }
  function applyFix(id, fi) {
    var it = state.issues[id], fx = it && fixesOf(it);
    if (!fx || !fx[fi]) return;
    var f = fx[fi], v = ed.value;
    pushUndo();
    ed.value = v.slice(0, f.start) + f.text + v.slice(f.end);
    var c = f.start + f.text.length;
    state.sel = -1;
    run();
    ed.focus({ preventScroll: true });
    ed.setSelectionRange(c, c);
  }
  function toast(msg) {
    toastEl.textContent = msg; toastEl.classList.add('on');
    clearTimeout(toast.t); toast.t = setTimeout(function () { toastEl.classList.remove('on'); }, 1800);
  }

  /* ---------- rules view ---------- */
  function ruleOn(id) { return state.rules[id] === undefined ? !FP.RULES[id].off : !!state.rules[id]; }
  function renderRules() {
    var h = '<div class="field"><label for="dialect"><strong>Spelling dictionary</strong></label><select id="dialect">' +
      [['gb', 'British (stylised, capitalised)'], ['us', 'American (stylized, capitalized)'], ['either', 'Accept either']].map(function (o) {
        return '<option value="' + o[0] + '"' + (state.dialect === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select><p class="hintline">The guide itself writes “stylised” and “capitalised”, so British is the default.</p></div>';
    var groups = [['language', 'Spelling, grammar and spacing'], ['guide', 'Fine Print style guide']];
    groups.forEach(function (g) {
      h += '<h3>' + g[1] + '</h3>';
      FP.CATS.filter(function (c) { return c.group === g[0]; }).forEach(function (c) {
        var ids = Object.keys(FP.RULES).filter(function (id) { return FP.RULES[id].cat === c.id; });
        var onCount = ids.filter(ruleOn).length;
        h += '<label class="r cat"><input type="checkbox" data-cat-all="' + c.id + '"' + (onCount === ids.length ? ' checked' : '') + '> ' + esc(c.label) + '</label>';
        ids.forEach(function (id) {
          if (ids.length === 1) return;
          h += '<label class="r" style="padding-left:24px"><input type="checkbox" data-rule="' + id + '"' + (ruleOn(id) ? ' checked' : '') + '> <span>' + esc(FP.RULES[id].title) + '</span></label>';
        });
      });
    });
    h += '<h3>Ignored items</h3><p class="hintline">' + state.ignored.length + ' ignored · ' + state.words.length + ' words in your dictionary</p>' +
      '<p><button type="button" class="btn" id="btn-reset-ign"' + (state.ignored.length + state.words.length ? '' : ' disabled') + '>Clear ignored items</button></p>';
    rulesPane.innerHTML = h;
  }

  /* ---------- events ---------- */
  notesEl.addEventListener('click', function (e) {
    var act = e.target.closest('[data-act]');
    if (act) {
      e.stopPropagation();
      var a = act.getAttribute('data-act'), id = +act.getAttribute('data-i');
      if (a === 'fix') applyFix(id, +act.getAttribute('data-f'));
      else if (a === 'ignore') { var it = state.issues[id]; state.ignored.push(ignKey(it)); LS.set('fp-ignored', state.ignored); state.sel = -1; run(); toast('Ignored. Undo it from the Rules tab.'); }
      else if (a === 'dict') { var w = state.issues[id].word.toLowerCase(); if (state.words.indexOf(w) < 0) state.words.push(w); LS.set('fp-words', state.words); state.sel = -1; run(); toast('Added “' + w + '” to your dictionary.'); }
      else if (a === 'more') { state.limit += 120; renderNotes(); }
      return;
    }
    var note = e.target.closest('.note');
    if (note) select(+note.getAttribute('data-i'), 'note');
  });
  notesEl.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('note')) { e.preventDefault(); select(+e.target.getAttribute('data-i'), 'note'); }
  });
  chipsEl.addEventListener('click', function (e) {
    var c = e.target.closest('.chip'); if (!c) return;
    var id = c.getAttribute('data-cat'); state.hidden[id] = !state.hidden[id];
    renderLayer(); renderSummary(); renderNotes();
  });
  ed.addEventListener('input', function () { state.sel = -1; schedule(); });
  ed.addEventListener('click', selectByCaret);
  ed.addEventListener('keyup', function (e) { if (/Arrow|Home|End|Page/.test(e.key)) selectByCaret(); });
  window.addEventListener('resize', function () { fit(); });

  $('#btn-sample').addEventListener('click', function () { pushUndo(); ed.value = SAMPLE; state.sel = -1; run(); });
  $('#btn-clear').addEventListener('click', function () { if (!ed.value) return; pushUndo(); ed.value = ''; state.sel = -1; run(); ed.focus(); });
  undoBtn.addEventListener('click', function () {
    var u = state.undo.pop(); if (!u) return;
    ed.value = u.v; state.sel = -1; run(); undoBtn.disabled = !state.undo.length;
    ed.focus({ preventScroll: true }); ed.setSelectionRange(u.c, u.c);
  });
  $('#btn-copy').addEventListener('click', function () {
    var t = ed.value;
    function fallback() { ed.focus(); ed.select(); try { document.execCommand('copy'); toast('Copied.'); } catch (e) { toast('Select the text and copy it.'); } }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { toast('Copied.'); }, fallback);
    else fallback();
  });

  function tab(which) {
    var notes = which === 'notes';
    $('#tab-notes').setAttribute('aria-selected', notes); $('#tab-rules').setAttribute('aria-selected', !notes);
    notesPane.hidden = !notes; rulesPane.hidden = notes;
    if (!notes) renderRules();
  }
  $('#tab-notes').addEventListener('click', function () { tab('notes'); });
  $('#tab-rules').addEventListener('click', function () { tab('rules'); });
  rulesPane.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'dialect') {
      state.dialect = t.value; LS.set('fp-dialect', state.dialect);
      ed.setAttribute('lang', state.dialect === 'us' ? 'en-US' : 'en-GB');
      loadDict(); return;
    }
    var r = t.getAttribute('data-rule'), c = t.getAttribute('data-cat-all');
    if (r) state.rules[r] = t.checked;
    if (c) Object.keys(FP.RULES).forEach(function (id) { if (FP.RULES[id].cat === c) state.rules[id] = t.checked; });
    LS.set('fp-rules', state.rules);
    run(); renderRules();
  });
  rulesPane.addEventListener('click', function (e) {
    if (e.target.id === 'btn-reset-ign') { state.ignored = []; state.words = []; LS.set('fp-ignored', []); LS.set('fp-words', []); run(); renderRules(); toast('Cleared.'); }
  });

  /* ---------- start ---------- */
  var saved = LS.get('fp-text', null);
  ed.value = (typeof saved === 'string' && saved.length) ? saved : SAMPLE;
  ed.setAttribute('lang', state.dialect === 'us' ? 'en-US' : 'en-GB');
  run();
  loadDict();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(); });
})();
