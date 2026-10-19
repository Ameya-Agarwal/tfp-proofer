/* Fine Print rule engine. Pure rules and regular expressions; no language model, no network. */
(function (root) {
  'use strict';

  var CATS = [
    { id: 'spelling', label: 'Spelling', group: 'language' },
    { id: 'grammar', label: 'Grammar', group: 'language' },
    { id: 'spacing', label: 'Spacing & marks', group: 'language' },
    { id: 'apostrophe', label: 'Apostrophe', group: 'guide' },
    { id: 'quotation', label: 'Quotation', group: 'guide' },
    { id: 'comma', label: 'Comma', group: 'guide' },
    { id: 'dash', label: 'Hyphen & dashes', group: 'guide' },
    { id: 'period', label: 'Period', group: 'guide' },
    { id: 'excl', label: 'Question & exclamation', group: 'guide' },
    { id: 'colon', label: 'Colon', group: 'guide' },
    { id: 'semicolon', label: 'Semicolon', group: 'guide' },
    { id: 'paren', label: 'Parentheses', group: 'guide' },
    { id: 'numbers', label: 'Numbers', group: 'guide' }
  ];

  var RULES = {};
  function def(id, cat, sev, title, ref, off) {
    RULES[id] = { id: id, cat: cat, sev: sev, title: title, ref: ref, off: !!off };
  }

  def('spelling', 'spelling', 'error', 'Spelling', 'Checked against a Hunspell dictionary. Capitalised names in mid-sentence, ALL-CAPS acronyms and web addresses are skipped.');

  def('g-repeat', 'grammar', 'error', 'Repeated word', 'The same word appears twice in a row.');
  def('g-article', 'grammar', 'error', 'a / an', 'Use “an” before a vowel sound and “a” before a consonant sound.');
  def('g-its', 'grammar', 'error', 'its / it’s', '“it’s” is short for “it is” or “it has”; “its” shows possession.');
  def('g-your', 'grammar', 'error', 'your / you’re', '“you’re” is short for “you are”; “your” shows possession.');
  def('g-their', 'grammar', 'error', 'their / there / they’re', '“their” shows possession, “there” points to a place or introduces a clause, and “they’re” is “they are”.');
  def('g-modal-of', 'grammar', 'error', '“of” for “have”', 'After could, would, should, must, might and may, the verb is “have” (or the contraction ’ve).');
  def('g-phrase', 'grammar', 'error', 'Common error', 'A frequently confused or non-standard phrase.');
  def('g-than', 'grammar', 'error', 'than / then', 'Use “than” to compare; “then” refers to time or sequence.');
  def('g-agree', 'grammar', 'error', 'Subject–verb agreement', 'The verb must agree with its subject in number and person.');
  def('g-i', 'grammar', 'error', 'Capital “I”', 'The pronoun “I” is always capitalised.');
  def('g-sentence-case', 'grammar', 'error', 'Capital at sentence start', 'A sentence begins with a capital letter.');
  def('g-proper-case', 'grammar', 'error', 'Days and months', 'Days of the week and months are capitalised.');
  def('g-double-neg', 'grammar', 'style', 'Double negative', 'Two negatives in one clause cancel each other out in standard English.');

  def('sp-double', 'spacing', 'style', 'Extra space', 'Use a single space between words.');
  def('sp-before', 'spacing', 'style', 'Space before punctuation', 'Punctuation attaches to the word before it.');
  def('sp-after', 'spacing', 'style', 'Missing space', 'Leave a space after a comma, colon, semicolon or full stop that ends a sentence.');
  def('sp-repeat', 'spacing', 'style', 'Repeated punctuation', 'One comma or semicolon is enough.');
  def('sp-brackets', 'spacing', 'error', 'Unmatched bracket or quote', 'Every opening bracket or quotation mark needs a closing partner.');

  def('apos-straight', 'apostrophe', 'style', 'Curly apostrophe', 'The guide sets apostrophes and quotation marks as typographic characters ( ’ ‘ ’ “ ” ), never the straight keyboard versions.');
  def('apos-decade', 'apostrophe', 'style', 'No apostrophe in decades', 'Do not use apostrophes with phrases like the 1980s.');
  def('apos-abbrev', 'apostrophe', 'style', 'Apostrophe, not opening quote', 'Remember that abbreviations such as the ’90s use an apostrophe ( ’ ) and not an opening quotation ( ‘ ).');
  def('apos-singular-s', 'apostrophe', 'style', 'Singular noun ending in s', 'For singular nouns that end with an s, use a ’s. E.g.: class’s, cactus’s, Jones’s, NSS’s, goodness’s, Looters’s.');
  def('apos-plural-s', 'apostrophe', 'style', 'Plural noun ending in s', 'For plural nouns that end with an s, do not add the s after the apostrophe. E.g.: Joneses’, flowers’.');
  def('apos-achilles', 'apostrophe', 'style', 'Achilles heel', 'Achilles heel does not include the apostrophe.');
  def('apos-double', 'apostrophe', 'style', 'Doubled possessive', 'Avoid additional apostrophes with nouns like Wendy’s.');
  def('apos-list', 'apostrophe', 'hint', 'Possessive over a list', 'If the possessive applies to lists, the apostrophe is attached to the last member. E.g.: Alice, Bob, and Charlie’s plan. If it applies to all members separately, attach it to each: Alice’s, Bob’s, and Charlie’s faces. Ambiguity must be rephrased.');

  def('quote-straight', 'quotation', 'style', 'Curly quotation marks', 'The guide sets quotation marks as typographic characters ( ‘ ’ “ ” ), never the straight keyboard versions.');
  def('quote-double-speech', 'quotation', 'style', 'Single quotes for speech', 'For reporting speech, use single quotes. E.g.: He said, ‘We’re trying our best.’');
  def('quote-double-phrase', 'quotation', 'hint', 'Double quotes are for verbatim phrases', 'Use double quotation marks to indicate phrases that are not quotes but are to be used verbatim. E.g.: The use of the phrase “first day” is encouraged to remove ambiguity. Also to be used for quotes within quotes. Use single quotation marks when implying that a word or phrase is quoted directly.');
  def('quote-comma-before', 'quotation', 'style', 'Comma before the quote', 'When reporting sentences with words such as said, add a comma before beginning the quote. E.g.: The member stated, ‘There was no evidence.’');
  def('quote-punct-outside', 'quotation', 'style', 'Punctuation inside the quote', 'When reporting a quote as a separate entity, add the ending punctuation before ending the quote. E.g.: ‘There was no evidence,’ the member stated.');
  def('quote-punct-embedded', 'quotation', 'style', 'Punctuation outside the quote', 'When the quote is a part of a larger sentence, put all extraneous punctuation outside the quotation. E.g.: The member was confident that ‘there was no evidence’.');
  def('quote-no-comma', 'quotation', 'style', 'No comma after ? or !', 'When the quote already ends with punctuation, do not add commas. E.g.: ‘Is this going on record?’ he asked.');
  def('quote-qe-end', 'quotation', 'style', 'Sentence ending after ? or !', 'When a sentence ends with a quote that ends with ? or !, forego the ending punctuation for the sentence. E.g.: The student indignantly exclaimed, ‘You’re failing me?’ The professor remained impassive.');
  def('quote-qe-case', 'quotation', 'style', 'Sentence case after ? or !', 'When a quote in the middle of a sentence ends with ? or !, remember to continue using sentence case with the rest of the sentence.');

  def('comma-splice', 'comma', 'style', 'Comma splice', 'Avoid using commas to join two sentences that make sense independently. This is called a comma splice. Use semicolons or (better yet) split them into two separate sentences.');
  def('comma-two-items', 'comma', 'style', 'Comma before and / or / but', 'Avoid using commas with conjunctions like and and but when they separate two items only.');
  def('comma-oxford', 'comma', 'style', 'Oxford comma', 'Add the Oxford comma after the second-to-last item of a list with three items or more. E.g.: We could speak to Alice, Bob, Charlie, or Dan.');

  def('dash-range', 'dash', 'style', 'En dash for ranges', 'The en dash indicates ranges. E.g.: The academic year 2012–2013, 0.2–1.7% carbon.');
  def('dash-fromto', 'dash', 'style', 'from / to with an en dash', 'Do not use the en dash and the words from, to, or between together. Use one or the other.');
  def('dash-spaced', 'dash', 'style', 'Dashes have no spaces', 'The guide sets dashes closed up to the words on either side. E.g.: The verdict was unanimous—guilty.');
  def('dash-double', 'dash', 'style', 'Em dash', 'Two hyphens are not a dash. The em dash ( — ) can be used to set off interjectory clauses.');
  def('dash-relation', 'dash', 'hint', 'En dash for relationships', 'The en dash also connects terms in relation to each other. E.g.: the Rome–Berlin axis, the liberal–conservative debate, Delhi–Mumbai flight. Use the hyphen only to form compound words.');
  def('dash-email', 'dash', 'style', 'email', 'Use the hyphen only to form compound words. Exception is made for email on the basis of near-universal usage.');

  def('period-abbr-extra', 'period', 'style', 'No period after this abbreviation', 'When an abbreviation ends with the same letter as the full version, forego the period. E.g.: Mr, Dr, and Ms do not end with a period.');
  def('period-abbr-missing', 'period', 'style', 'Abbreviation needs a period', 'Abbreviations that do not end with the same letter as the full version keep the period. E.g.: Capt. and Prof.');
  def('period-ellipsis', 'period', 'style', 'Ellipsis is three periods', 'An ellipsis ( … ) consists of three—and only three—periods and is used to indicate either incompleteness or omission when reporting.');
  def('period-ellipsis-char', 'period', 'hint', 'Ellipsis character', 'An ellipsis ( … ) consists of three—and only three—periods. The guide sets it as the single ellipsis character.');
  def('period-acronym', 'period', 'style', 'No periods in acronyms', 'Acronyms and initialisms do not take periods after each letter unless stylised that way. E.g.: radar, scuba, NASA, NAB, VIP, and LTC. The institute T.I.M.E. is stylised with periods.');
  def('period-title', 'period', 'hint', 'Titles take no period', 'Avoid periods when ending titles or subtitles.');
  def('period-long', 'period', 'hint', 'Long sentence', 'Use periods liberally to end sentences. The fewer words per sentence, the more readable the text becomes.');

  def('excl-bang', 'excl', 'hint', 'Exclamation mark', 'Avoid both ? and ! in reporting unless necessary or within quotation.');
  def('excl-question', 'excl', 'hint', 'Question mark', 'Avoid both ? and ! in reporting unless necessary or within quotation.', true);
  def('excl-repeat', 'excl', 'style', 'Repeated ? or !', 'Avoid both ? and ! in reporting unless necessary or within quotation. One mark is enough.');

  def('colon-capital', 'colon', 'style', 'Lowercase after a colon', 'The first word after a colon is not capitalised.');
  def('semi-misuse', 'semicolon', 'style', 'Semicolon joins complete sentences', 'The semicolon connects sentence fragments that stand as complete sentences on their own, but complement each other. E.g.: There was nothing he could do; there were too many issues. When items in a list already include commas, semicolons are used to separate them.');

  def('paren-terminal', 'paren', 'style', 'Fragment in parentheses', 'If the parentheses contain a sentence fragment, do not begin with a capital letter or use terminal punctuation.');
  def('paren-sentence', 'paren', 'hint', 'Sentence in parentheses', 'If a full sentence is within parentheses, capitalise and punctuate appropriately.');
  def('paren-aside', 'paren', 'hint', 'Parenthetical aside', 'Parentheses can interject information similar to a pair of commas or em dashes, though the latter two are preferred. As a general rule, use parentheses for abbreviations or acronyms that are not self-explanatory or commonplace.');

  def('num-small', 'numbers', 'style', 'Spell out below 20', 'In case of independent usage, use words for numbers strictly below 20 and figures for numbers strictly above nineteen.');
  def('num-big-word', 'numbers', 'style', 'Figures above nineteen', 'In case of independent usage, use words for numbers strictly below 20 and figures for numbers strictly above nineteen.');
  def('num-grouping', 'numbers', 'style', 'Number format', '“1,234,567” is the format to be used for reporting such figures.');
  def('num-indian', 'numbers', 'style', 'Thousands grouping', '“1,234,567” is the format to be used for reporting such figures: groups of three digits, not the lakh–crore style.');
  def('num-large', 'numbers', 'hint', 'Named powers of ten', 'Powers of ten that have pre-existing names will use those in writing. 30 trillion is significantly easier to interpret than 30,000,000,000,000. Usage of this rule is left to the discretion of the writer and editor.');

  var ABBR_FULL = {
    Mr: 'Mister', Mrs: 'Mistress', Ms: 'Miss', Dr: 'Doctor', Jr: 'Junior', Sr: 'Senior', St: 'Saint', Mt: 'Mount',
    Ltd: 'Limited', Lt: 'Lieutenant', Sgt: 'Sergeant', Col: 'Colonel', Fr: 'Father', Cpl: 'Corporal', Cmdr: 'Commander',
    Supt: 'Superintendent', Dept: 'Department', Govt: 'Government',
    Capt: 'Captain', Prof: 'Professor', Gen: 'General', Gov: 'Governor', Sen: 'Senator', Rep: 'Representative',
    Pres: 'President', Rev: 'Reverend', Hon: 'Honourable', Maj: 'Major', Adm: 'Admiral', Insp: 'Inspector'
  };
  function needsPeriod(a) { var f = ABBR_FULL[a]; return a.slice(-1).toLowerCase() !== f.slice(-1).toLowerCase(); }
  var TITLE_ABBR = { Mr: 1, Mrs: 1, Ms: 1, Dr: 1, Lt: 1, Sgt: 1, Col: 1, Fr: 1, Cpl: 1, Cmdr: 1, Supt: 1 };
  var SPLIT_ABBR = {};
  Object.keys(ABBR_FULL).forEach(function (k) { SPLIT_ABBR[k.toLowerCase()] = 1; });
  var SOFT_ABBR = { etc: 1, vs: 1, inc: 1, ltd: 1, co: 1, corp: 1, dept: 1, govt: 1, fig: 1, vol: 1, no: 1, approx: 1, cf: 1 };

  var NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  var TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
  var UNITS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
  var MONTHS_RE = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*$/i;
  var LABELS = /^(chapter|chap|ch|figure|fig|table|page|pages|pp|p|section|sec|rule|part|vol|no|article|art|step|question|q|level|grade|class|room|track|version|v|phase|round|item|line|lines|verse|act|scene|paragraph|para|clause|appendix|week|day|year|sem|semester|lecture|unit|module)$/i;
  var UNIT_AFTER = /^(km|kg|cm|mm|m|g|mg|ml|l|gb|mb|kb|tb|hz|khz|mhz|ghz|kw|mw|v|a|c|f|k|x|px|pt|em|rem|am|pm|bpm|rpm|mph|kmph|lb|lbs|oz|ft|in|yr|yrs|hr|hrs|min|mins|sec|secs|ms|ns|nm|µm|um)\b/i;
  var WORDLIKE_ACRONYMS = { NASA: 1, NATO: 1, UNESCO: 1, UNICEF: 1, RADAR: 1, SCUBA: 1, LASER: 1, SONAR: 1, FIFA: 1, OPEC: 1, ASEAN: 1, BITS: 1, IIT: 0, NEET: 1, JEE: 0, GATE: 1 };
  var STOP = /^(i|he|she|it|they|we|you|the|a|an|this|that|these|those|in|on|at|by|for|with|of|to|not|so|but|yet|then|also|just|only|even|still|is|are|was|were|be|been|has|have|had|do|does|did|will|would|can|could|should|may|might|must|hence|thus|therefore|however|now|there|here|who|which|what|when|where|how|if|as|or|and|nor|my|your|his|her|our|their|its|no|yes)$/i;
  var INTRO_WORDS = /^(however|therefore|thus|hence|moreover|furthermore|meanwhile|finally|first|second|third|then|also|instead|otherwise|yes|no|well|still|now|today|yesterday|tomorrow|nevertheless|consequently|besides|indeed|additionally|similarly|likewise|firstly|secondly|lastly|next|later|earlier|soon|sometimes|usually|often|generally|overall|clearly|naturally|honestly|frankly|personally|unfortunately|fortunately|luckily|sadly|eventually|ultimately|afterwards|afterward|here|there|again|so|but|and|or|yet|for|nor)$/i;
  var CLAUSE_START = /^\s*(however|therefore|thus|hence|moreover|furthermore|meanwhile|finally|first|second|third|then|also|instead|otherwise|yes|no|well|still|now|today|yesterday|tomorrow|nevertheless|consequently|besides|indeed|in|on|at|by|for|with|after|before|during|despite|according|as|if|when|while|although|though|because|since|unless|once|until|whenever|wherever|whereas|so|given|having|being|upon|under|over|within|without|among|between|through|throughout|from|to|of|like|unlike|against|into|onto|about|around|across|per|via|but|and|or|yet)\b/i;
  var SUBORD = /\b(if|when|although|though|because|since|while|unless|once|until|whenever|wherever|whereas|after|before|as soon as|even if|so that|provided|whether)\b/i;
  var AUX = { is: 1, was: 1, are: 1, were: 1, am: 1, has: 1, have: 1, had: 1, will: 1, would: 1, can: 1, could: 1, should: 1, must: 1, may: 1, might: 1, did: 1, does: 1, do: 1, shall: 1 };
  var IRREG = 'went came saw took made said got gave ate ran knew thought found told felt left kept began wrote spoke drove flew sat stood brought bought caught taught fell held heard led lost met paid read sent sold spent threw understood won wore woke became built chose dug drew drank forgot grew hid hung hurt lay put rode rose shook shut sang slept swam tore woke'.split(' ');
  var IRREG_SET = {}; IRREG.forEach(function (w) { IRREG_SET[w] = 1; });
  var BASE_V = 'go think know want need like love see say get make take come give find tell feel keep begin write speak drive fly sit stand bring buy catch teach fall hold hear lead lose meet pay read send sell spend throw understand win wear become build choose draw drink grow hide hang put ride rise sing sleep swim believe hope wish mean seem look work try use help show turn start play run move live ask call'.split(' ');
  var BASE_SET = {}; BASE_V.forEach(function (w) { BASE_SET[w] = 1; });
  var SAID = 'said|says|stated|states|asked|asks|replied|replies|added|adds|exclaimed|shouted|whispered|announced|declared|claimed|wrote|noted|remarked|explained|argued|cried|yelled|answered|responded|continued|muttered|insisted|suggested|told|thought|cheered|screamed|snapped|sighed|growled';
  var SAID_RE = '(?:' + SAID + ')';

  function isVerbish(w) {
    w = w.toLowerCase();
    if (AUX[w] || IRREG_SET[w] || BASE_SET[w]) return true;
    if (/^[a-z]{3,}ed$/.test(w)) return true;
    if (/^[a-z]{3,}[^su’']s$/.test(w) && !/^(this|his|its|was|has|does|always|perhaps|sometimes|yes|thus|plus)$/.test(w)) return true;
    return false;
  }

  function norm(t) {
    var o = '', n = t.length, i, c, p, nx;
    for (i = 0; i < n; i++) {
      c = t[i];
      if (c === "'") {
        p = t[i - 1]; nx = t[i + 1];
        if (i > 0 && !/[\s(\[{—–\-“"‘]/.test(p)) o += '’';
        else if (nx && /\d/.test(nx) && /\d/.test(t[i + 2] || '')) o += '’';
        else o += '‘';
      } else if (c === '"') {
        if (i === 0 || /[\s(\[{—–\-‘]/.test(t[i - 1])) o += '“'; else o += '”';
      } else o += c;
    }
    return o;
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function matchCase(src, repl) { return /^[A-Z]/.test(src) ? cap(repl) : repl; }

  function splitSentences(T) {
    var res = [], n = T.length, s = 0, i = 0, k, j, c;
    function push(a, b) {
      while (a < b && /\s/.test(T[a])) a++;
      while (b > a && /\s/.test(T[b - 1])) b--;
      if (b > a) res.push({ start: a, end: b });
    }
    function isAbbrAt(p) {
      var q = p;
      while (q > 0 && /[A-Za-z0-9]/.test(T[q - 1])) q--;
      var tok = T.slice(q, p);
      if (tok.length === 1) return /[A-Z]/.test(tok) || T[q - 1] === '.';
      if (/^\d+$/.test(tok)) { var b = q; while (b > 0 && /[ \t]/.test(T[b - 1])) b--; return b === 0 || T[b - 1] === '\n'; }
      var low = tok.toLowerCase();
      if (SPLIT_ABBR[low]) return true;
      if (SOFT_ABBR[low]) { var z = p + 1; while (z < n && /[ \t]/.test(T[z])) z++; return /[a-z]/.test(T[z] || ''); }
      return false;
    }
    while (i < n) {
      c = T[i];
      if (c === '\n' && T[i + 1] === '\n') {
        push(s, i); k = i; while (k < n && /\s/.test(T[k])) k++; s = k; i = k; continue;
      }
      if (c === '.' || c === '!' || c === '?' || c === '…') {
        j = i + 1;
        while (j < n && /[.!?…]/.test(T[j])) j++;
        var run = T.slice(i, j), j0 = j;
        while (j < n && /[’”)\]]/.test(T[j])) j++;
        if (j >= n || /\s/.test(T[j])) {
          if (c === '.' && j === i + 1 && isAbbrAt(i)) { i = j; continue; }
          var kk = j; while (kk < n && /[ \t]/.test(T[kk])) kk++;
          if (/[a-z]/.test(T[kk] || '') && (/…|\.{2,}/.test(run) || j > j0)) { i = j; continue; }
          push(s, j);
          k = j; while (k < n && /\s/.test(T[k])) k++;
          s = k; i = k; continue;
        }
        i = j; continue;
      }
      i++;
    }
    push(s, n);
    return res;
  }

  function quoteSpans(T) {
    var spans = [], n = T.length, i, j;
    for (i = 0; i < n; i++) {
      var c = T[i];
      if (c === '‘') {
        for (j = i + 1; j < n; j++) {
          if (T[j] === '’' && !/[A-Za-z0-9]/.test(T[j + 1] || ' ')) { spans.push([i, j]); i = j; break; }
          if (T[j] === '\n' && T[j + 1] === '\n') break;
        }
      } else if (c === '“') {
        j = T.indexOf('”', i + 1);
        if (j > 0) spans.push([i, j]);
      }
    }
    return spans;
  }

  function startsVowelSound(w) {
    var lw = w.toLowerCase();
    if (/^\d/.test(w)) { var d = w.match(/^\d+/)[0]; return /^8/.test(d) || d === '11' || d === '18'; }
    if (/^[A-Z]{2,5}$/.test(w) && !WORDLIKE_ACRONYMS[w]) return 'AEFHILMNORSX'.indexOf(w[0]) >= 0;
    if (/^(hour|honest|honor|honour|heir)/.test(lw)) return true;
    if (/^(uni([^n]|$)|use|usu|uti|eu|ewe|one|once|ubiq|ufo|ura)/.test(lw)) return false;
    return 'aeiou'.indexOf(lw[0]) >= 0;
  }

  function groupDigits(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function check(text, opts) {
    opts = opts || {};
    var enabled = opts.enabled || {};
    var T = norm(text);
    var out = [];
    function on(id) { return enabled[id] === undefined ? !RULES[id].off : !!enabled[id]; }

    function add(rule, s, e, msg, fixes) {
      if (!on(rule)) return;
      var r = RULES[rule];
      var fx = (fixes || []).map(function (f) {
        return { label: f.label == null ? (f.text === '' ? 'Delete' : f.text) : f.label, text: f.text, start: f.s == null ? s : f.s, end: f.e == null ? e : f.e };
      });
      out.push({ rule: rule, cat: r.cat, sev: r.sev, start: s, end: e, msg: msg, fixes: fx, text: text.slice(s, e) });
    }
    function each(re, cb) {
      var m, guard = 0;
      re.lastIndex = 0;
      while ((m = re.exec(T)) && guard++ < 20000) {
        if (m[0].length === 0) { re.lastIndex++; continue; }
        cb(m);
      }
    }
    function prevWord(pos) {
      var m = /([A-Za-z’]+)\s*$/.exec(T.slice(Math.max(0, pos - 40), pos));
      return m ? m[1].toLowerCase() : '';
    }

    var sents = splitSentences(T);
    var sentStart = {};
    sents.forEach(function (sn) { var k = sn.start; while (k < sn.end && !/[A-Za-z0-9]/.test(T[k])) k++; sentStart[k] = sn; });
    var qspans = quoteSpans(T);
    function inQuote(p) { for (var i = 0; i < qspans.length; i++) if (p > qspans[i][0] && p < qspans[i][1]) return true; return false; }

    var zones = [];
    each(/\b(?:https?:\/\/|www\.)\S+|\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, function (m) { zones.push([m.index, m.index + m[0].length]); });
    function inZone(p) { for (var i = 0; i < zones.length; i++) if (p >= zones[i][0] && p < zones[i][1]) return true; return false; }

    /* ---------- Spelling ---------- */
    if (on('spelling') && opts.spell) {
      each(/[A-Za-zÀ-ɏ]+(?:[’'][A-Za-zÀ-ɏ]+)*/g, function (m) {
        var w = m[0], s = m.index, e = s + w.length;
        if (w.length < 2) return;
        if (/\d/.test(T[s - 1] || '') || /\d/.test(T[e] || '')) return;
        if (/[@#_\/]/.test(T[s - 1] || '')) return;
        if (/^[A-Z]{2,}(?:’s)?$/.test(w)) return;
        if (/[a-z][A-Z]/.test(w)) return;
        if (inZone(s)) return;
        if (/^[A-Z]/.test(w) && !sentStart[s] && !opts.checkNames) return;
        var chk = w.replace(/’/g, "'");
        var lw = chk.toLowerCase();
        if (opts.ignore && opts.ignore[lw]) return;
        if (opts.spell(chk)) return;
        if (/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|april|june|july|september|october|november|december)$/.test(lw)) return;
        var pre = /^(un|re|non|pre|anti|over|under|semi|co|sub|inter|multi|mis|dis|out|post|pro)(.{4,})$/.exec(lw);
        if (pre && opts.spell(pre[2])) return;
        if (/'s$/i.test(chk) && opts.spell(chk.slice(0, -2))) return;
        add('spelling', s, e, '“' + w + '” isn’t in the dictionary.', []);
        out[out.length - 1].word = chk;
      });
    }

    /* ---------- Typography of apostrophes and quotes ---------- */
    if (on('apos-straight') || on('quote-straight')) {
      for (var qi = 0; qi < text.length; qi++) {
        var ch = text[qi];
        if (ch === "'") {
          var rep = T[qi];
          add('apos-straight', qi, qi + 1, 'Straight ' + (rep === '‘' ? 'opening quotation mark' : 'apostrophe') + '; use the curly ' + rep + '.', [{ text: rep, label: rep }]);
        } else if (ch === '"') {
          var rep2 = T[qi];
          add('quote-straight', qi, qi + 1, 'Straight quotation mark; use the curly ' + rep2 + '.', [{ text: rep2, label: rep2 }]);
        }
      }
    }

    each(/(\d{2,4})’s\b/g, function (m) {
      var s = m.index, digits = m[1];
      if (digits.length === 4) add('apos-decade', s, s + m[0].length, 'Decades take no apostrophe: write ' + digits + 's.', [{ text: digits + 's' }]);
      else if (digits.length === 2 && !/\d/.test(T[s - 1] || '') && /[a-z ]/.test(T[s - 1] || ' ')) add('apos-decade', s, s + m[0].length, 'Write the ’' + digits + 's, with the apostrophe before the digits.', [{ text: '’' + digits + 's' }]);
    });
    each(/‘(\d{2}s?)\b/g, function (m) {
      add('apos-abbrev', m.index, m.index + 1, 'An abbreviation like the ’90s starts with an apostrophe, not an opening quotation mark.', [{ text: '’' }]);
    });
    each(/\b(Achilles)’s?(?= heel)/g, function (m) {
      add('apos-achilles', m.index + m[1].length, m.index + m[0].length, 'Write “Achilles heel” without an apostrophe.', [{ text: '' }]);
    });
    each(/\b([A-Za-z]+’s)(’s?)(?![A-Za-z])/g, function (m) {
      add('apos-double', m.index + m[1].length, m.index + m[0].length, 'Avoid a second apostrophe on a noun that is already possessive.', [{ text: '' }]);
    });
    each(/\b([A-Za-z]+)’(?![A-Za-z’])/g, function (m) {
      var w = m[1], s = m.index + w.length;
      if (w.slice(-1) !== 's') return;
      if (/^Achilles$/.test(w)) return;
      if (/^(ours|yours|hers|theirs|its|his|whose|us|them|me|him)$/i.test(w)) return;
      var lineStart = T.lastIndexOf('\n', m.index) + 1;
      var seg = T.slice(lineStart, m.index);
      var opens = (seg.match(/‘/g) || []).length, closes = (seg.match(/’(?![A-Za-z])/g) || []).length;
      if (opens > closes) return; // this is probably a closing quotation mark
      var singular;
      if (/^[A-Z]/.test(w) && !sentStart[m.index]) singular = !/(ses|xes|zes|ches|shes)$/.test(w);
      else singular = /(ss|us|ness|ous|is|ics)$/.test(w.toLowerCase());
      if (singular) add('apos-singular-s', s, s + 1, '“' + w + '” looks singular, and singular nouns ending in s take ’s (' + w + '’s). If it is a plural, keep the bare apostrophe.', [{ text: '’s', label: w + '’s' }]);
    });
    each(/\b([a-z]+s)’s\b/g, function (m) {
      var w = m[1];
      if (/(ss|us|is|ous)$/.test(w)) return;
      add('apos-plural-s', m.index + w.length, m.index + m[0].length, 'Plural nouns ending in s take only the apostrophe: ' + w + '’.', [{ text: '’', label: w + '’' }]);
    });
    each(/\b([A-Z][a-z]+(?:ses|xes|zes|ches|shes))’s\b/g, function (m) {
      var w = m[1];
      add('apos-plural-s', m.index + w.length, m.index + m[0].length, 'Plural nouns ending in s take only the apostrophe: ' + w + '’.', [{ text: '’' }]);
    });
    each(/\b([A-Z][a-z]+(?:,\s+[A-Z][a-z]+)*,?\s+(?:and|or)\s+[A-Z][a-z]+)’s?\b/g, function (m) {
      add('apos-list', m.index, m.index + m[0].length, 'A possessive after a list means joint ownership. If each owns separately, write “Alice’s, Bob’s, and Charlie’s”. If it could be read either way, rephrase.', []);
    });

    /* ---------- Quotation ---------- */
    each(/“([^“”]*)”/g, function (m) {
      var s = m.index, e = s + m[0].length, inner = m[1];
      var words = (inner.match(/\S+/g) || []).length;
      var insideSingle = false;
      for (var i = 0; i < qspans.length; i++) if (T[qspans[i][0]] === '‘' && s > qspans[i][0] && e <= qspans[i][1] + 1) insideSingle = true;
      if (insideSingle) return;
      var before = T.slice(Math.max(0, s - 25), s);
      var speechy = /[.,?!]$/.test(inner.trim()) || new RegExp('\\b' + SAID_RE + '\\W*$', 'i').test(before) || words >= 6;
      var canFix = inner.indexOf('‘') < 0;
      var fix = canFix ? [{ text: '‘' + inner + '’', label: '‘' + (inner.length > 18 ? inner.slice(0, 16) + '…' : inner) + '’' }] : [];
      if (speechy) add('quote-double-speech', s, e, 'Reported speech takes single quotes. Double quotes are kept for verbatim phrases and quotes within quotes.', fix);
      else add('quote-double-phrase', s, e, 'Double quotes are for a phrase to be used verbatim (like “first day”) or a quote within a quote. For a quoted word or phrase, use single quotes.', fix);
    });
    each(new RegExp('\\b(' + SAID_RE + ')([ \\t]+)(?=[‘“])', 'gi'), function (m) {
      var s = m.index + m[1].length;
      add('quote-comma-before', s, s + m[2].length, 'Add a comma before a quote introduced by “' + m[1] + '”.', [{ text: ', ', label: m[1] + ',' }]);
    });
    each(new RegExp('([^\\s‘“])’,(?=\\s+(?:[A-Za-z]+\\s+){0,3}?' + SAID_RE + '\\b)', 'g'), function (m) {
      var s = m.index + 1;
      if (/[?!]/.test(m[1])) return;
      add('quote-punct-outside', s, s + 2, 'Put the ending punctuation inside the quotation marks when the quote stands as its own sentence.', [{ text: ',’', label: ',’' }]);
    });
    each(/\b(that|whether|because|if)(\s+‘[^‘’\n]*?)([.,])’/g, function (m) {
      var p = m.index + m[1].length + m[2].length;
      add('quote-punct-embedded', p, p + 2, 'The quote is part of a larger sentence, so the ' + (m[3] === '.' ? 'full stop' : 'comma') + ' goes outside the quotation marks.', [{ text: '’' + m[3], label: '’' + m[3] }]);
    });
    each(new RegExp('([?!])’,(?=\\s+(?:[A-Za-z]+\\s+){0,3}?' + SAID_RE + '\\b)', 'g'), function (m) {
      var s = m.index + 2;
      add('quote-no-comma', s, s + 1, 'The quote already ends with ' + m[1] + ', so no comma follows it.', [{ text: '' }]);
    });
    each(/([?!]),’/g, function (m) {
      add('quote-no-comma', m.index + 1, m.index + 2, 'The quote already ends with ' + m[1] + ', so no comma is added.', [{ text: '' }]);
    });
    each(/([?!])’([.!?])(?![.!?])/g, function (m) {
      add('quote-qe-end', m.index + 2, m.index + 3, 'The quote ends with ' + m[1] + ', so the sentence needs no further end mark.', [{ text: '' }]);
    });
    each(/[?!]’,\s+(The|He|She|They|It|We|You|His|Her|Their|This|That|A|An)\b/g, function (m) {
      var w = m[1], s = m.index + m[0].length - w.length;
      add('quote-qe-case', s, s + w.length, 'Continue in sentence case after a quote that ends with ? or ! in mid-sentence.', [{ text: w.toLowerCase() }]);
    });

    /* ---------- Comma ---------- */
    sents.forEach(function (sn) {
      var seg = T.slice(sn.start, sn.end);
      var re = /,\s+((?:I|he|she|it|they|we|you|there)(?:’(?:s|m|re|ve|ll|d))?)\b(?:\s+([a-z’]+))?/gi, m;
      while ((m = re.exec(seg))) {
        var pron = m[1], contraction = /’/.test(pron), nxt = m[2];
        if (!contraction && !(nxt && isVerbish(nxt))) continue;
        var clause = seg.slice(0, m.index);
        var words = clause.match(/[A-Za-z’']+/g) || [];
        if (words.length < 4) continue;
        if (CLAUSE_START.test(clause)) continue;
        if (SUBORD.test(clause)) continue;
        if (/\b(hence|thus|therefore|however|moreover|consequently|then|also|instead|otherwise|meanwhile|finally)\s*$/i.test(clause)) continue;
        if (/[‘“]/.test(clause) || /["“”]/.test(seg.slice(m.index, m.index + 3))) continue;
        if (/(?:^|\s)(?:said|says|asked|replied|added|wrote|noted|thought|told|explained)\s*$/i.test(clause)) continue;
        var comma = sn.start + m.index;
        var pStart = comma + m[0].indexOf(pron, 1);
        var pEnd = pStart + pron.length;
        var capPron = /^i$/i.test(pron) ? 'I' : cap(pron);
        add('comma-splice', comma, comma + 1, 'Two independent sentences are joined by a comma. Split them into two sentences, or use a semicolon.', [
          { s: comma, e: pEnd, text: '. ' + capPron, label: '. ' + capPron },
          { text: ';', label: ';' }
        ]);
      }
    });
    each(/([A-Za-z’-]+),[ \t]+(and|or|but)[ \t]+([A-Za-z’-]+)(?=[ \t]*(?:[.!?;:)”’]|$|\n))/g, function (m) {
      var pre = T.slice(0, m.index).replace(/\s+$/, '');
      if (/,$/.test(pre)) return;
      if (STOP.test(m[3]) || STOP.test(m[1]) && m[2] !== 'but') return;
      if (/^(then|so|now|hence|thus|therefore|however)$/i.test(m[3])) return;
      var s = m.index + m[1].length;
      add('comma-two-items', s, s + 1, 'No comma is needed before “' + m[2] + '” when it joins just two items.', [{ text: '' }]);
    });
    each(/([A-Za-z’-]+),\s+([A-Za-z’-]+)\s+(and|or)\s+([A-Za-z’-]+)/g, function (m) {
      if (STOP.test(m[1]) || STOP.test(m[2]) || STOP.test(m[4])) return;
      if (INTRO_WORDS.test(m[1]) || /^\d/.test(m[1])) return;
      if (/^[A-Z]/.test(m[1]) && /(^|[.!?]\s*)$/.test(T.slice(0, m.index)) && /ly$/i.test(m[1])) return;
      var s = m.index + m[0].indexOf(m[2], m[1].length + 1) + m[2].length;
      add('comma-oxford', s, s, 'Add the Oxford comma before “' + m[3] + '” in a list of three or more.', [{ s: s, e: s, text: ',', label: m[2] + ', ' + m[3] }]);
    });

    /* ---------- Hyphen and dashes ---------- */
    each(/\b(from|between)\s+(\d[\d,.]*%?|[A-Za-z]+)\s*([–-])\s*(\d[\d,.]*%?|[A-Za-z]+)\b/gi, function (m) {
      var numeric = /^\d/.test(m[2]) && /^\d/.test(m[4]);
      if (m[3] === '-' && !numeric) return;
      var word = m[1].toLowerCase() === 'from' ? 'to' : 'and';
      add('dash-fromto', m.index, m.index + m[0].length, 'Use either “' + m[1] + '” with “' + word + '” or an en dash, not both.', [
        { text: m[1] + ' ' + m[2] + ' ' + word + ' ' + m[4] },
        { text: m[2] + '–' + m[4] }
      ]);
    });
    each(/(\d[\d,.]*)[ \t]*-[ \t]*(\d[\d,.]*)/g, function (m) {
      var s = m.index;
      if (/[\d\-–]/.test(T[s - 1] || '')) return;
      if (/^[-–]\d/.test(T.slice(s + m[0].length, s + m[0].length + 2))) return;
      if (m[1].replace(/\D/g, '').length > 4 || m[2].replace(/\D/g, '').length > 4) return;
      if (/\b(from|between)\s+$/i.test(T.slice(Math.max(0, s - 12), s))) return;
      if (inZone(s)) return;
      var ds = s + m[1].length, de = s + m[0].length - m[2].length;
      add('dash-range', ds, de, 'Ranges take an en dash (–), not a hyphen.', [{ text: '–', label: m[1] + '–' + m[2] }]);
    });
    each(/(\S)[ \t]+([-–—])[ \t]+(?=\S)/g, function (m) {
      var s = m.index + 1, e = m.index + m[0].length;
      var next = T[e];
      if (m[2] === '-' && /\d/.test(m[1]) && /\d/.test(next)) return;
      if (m[2] === '-' && /[A-Za-z]/.test(m[1]) === false && /[A-Za-z]/.test(next) === false) return;
      add('dash-spaced', s, e, 'Dashes are closed up to the words on either side, with no spaces.', [
        { text: '—', label: '—' },
        { text: '–', label: '–' }
      ]);
    });
    each(/-{2,3}/g, function (m) {
      if (T[m.index - 1] === '-' || T[m.index + m[0].length] === '-') return;
      add('dash-double', m.index, m.index + m[0].length, 'Use a real em dash (—) instead of ' + m[0] + '.', [{ text: '—' }]);
    });
    each(/\b([A-Z][a-z]{2,})-([A-Z][a-z]{2,})\b|\b(north|south|east|west)-(north|south|east|west)\b/g, function (m) {
      var hy = m.index + (m[1] || m[3]).length;
      add('dash-relation', hy, hy + 1, 'If these two terms stand in relation to each other (Delhi–Mumbai), use an en dash. Ignore this for a hyphenated name.', [{ text: '–' }]);
    });
    each(/\b([Ee])-mail(s?)\b/g, function (m) {
      add('dash-email', m.index, m.index + m[0].length, 'Write “email” without a hyphen.', [{ text: m[1] + 'mail' + m[2] }]);
    });

    /* ---------- Period ---------- */
    each(/\b([A-Z][a-z]{1,4})\.(?=\s|$|[,)])/g, function (m) {
      var a = m[1];
      if (!ABBR_FULL[a] || needsPeriod(a)) return;
      var after = T.slice(m.index + m[0].length).match(/^\s*(\S)/);
      var nextCh = after ? after[1] : '';
      if (!TITLE_ABBR[a]) {
        if (a === 'St' || a === 'Mt') { if (!/[A-Z]/.test(nextCh)) return; }
        else if (!/[a-z,\d)]/.test(nextCh)) return;
      } else if (!nextCh) return;
      add('period-abbr-extra', m.index + a.length, m.index + a.length + 1, '“' + a + '” ends with the same letter as “' + ABBR_FULL[a] + '”, so it takes no period.', [{ text: '' }]);
    });
    each(/\b(Capt|Prof|Gen|Gov|Sen|Rep|Pres|Rev|Hon|Maj|Adm|Insp)(?=\s+[A-Z][a-z])/g, function (m) {
      var a = m[1], e = m.index + a.length;
      if (T[e] === '.') return;
      add('period-abbr-missing', e, e, '“' + a + '” ends with a different letter from “' + ABBR_FULL[a] + '”, so it keeps its period.', [{ s: e, e: e, text: '.', label: a + '.' }]);
    });
    each(/(?:^|[^.])(\.{2}(?!\.)|\.{4,})/g, function (m) {
      var s = m.index + m[0].length - m[1].length;
      add('period-ellipsis', s, s + m[1].length, 'An ellipsis is three periods, and only three.', [{ text: '…' }]);
    });
    each(/(?:^|[^.])(\.\.\.)(?!\.)/g, function (m) {
      var s = m.index + m[0].length - 3;
      add('period-ellipsis-char', s, s + 3, 'Use the single ellipsis character ( … ).', [{ text: '…' }]);
    });
    each(/…\./g, function (m) {
      add('period-ellipsis', m.index, m.index + 2, 'An ellipsis already carries its three periods; do not add a fourth.', [{ text: '…' }]);
    });
    each(/(?:\b[A-Z]\.){2,}/g, function (m) {
      if (/^T\.I\.M\.E\.?$/.test(m[0])) return;
      var letters = m[0].replace(/\./g, '');
      var after = T.slice(m.index + m[0].length, m.index + m[0].length + 3);
      var fixes = [{ text: letters }];
      if (/^(\s+[A-Z]|\s*$)/.test(after)) fixes.push({ text: letters + '.' });
      add('period-acronym', m.index, m.index + m[0].length, 'Acronyms and initialisms take no periods (' + letters + ') unless stylised that way, as T.I.M.E. is.', fixes);
    });
    (function titles() {
      var lines = T.split('\n'), pos = 0;
      for (var i = 0; i < lines.length; i++) {
        var ln = lines[i], trimmed = ln.replace(/\s+$/, '');
        var prevBlank = i === 0 || /^\s*$/.test(lines[i - 1]);
        var nextBlank = i + 1 < lines.length && /^\s*$/.test(lines[i + 1]);
        var hasBody = i + 2 < lines.length && /\S/.test(lines[i + 2]);
        var words = trimmed.match(/\S+/g) || [];
        if (prevBlank && nextBlank && hasBody && words.length >= 1 && words.length <= 10 && /\.$/.test(trimmed) && !/\.\s+\S/.test(trimmed) && !/\.\.$/.test(trimmed)) {
          var big = words.filter(function (w) { return w.length > 3; });
          var caps = big.filter(function (w) { return /^[A-Z]/.test(w); });
          if (big.length === 0 || caps.length / big.length >= 0.6) {
            var e = pos + trimmed.length;
            add('period-title', e - 1, e, 'This reads like a title or subtitle; titles end without a period.', [{ text: '' }]);
          }
        }
        pos += ln.length + 1;
      }
    })();
    sents.forEach(function (sn) {
      var words = (T.slice(sn.start, sn.end).match(/\S+/g) || []).length;
      if (words > 30) add('period-long', sn.start, sn.end, 'This sentence runs to ' + words + ' words. Shorter sentences read better; consider splitting it.', []);
    });

    /* ---------- ? and ! ---------- */
    each(/[!?]{2,}/g, function (m) {
      add('excl-repeat', m.index, m.index + m[0].length, 'One mark is enough.', [{ text: m[0][0] }]);
    });
    each(/!/g, function (m) {
      if (/[!?]/.test(T[m.index - 1] || '') || /[!?]/.test(T[m.index + 1] || '')) return;
      if (inQuote(m.index)) return;
      add('excl-bang', m.index, m.index + 1, 'Avoid exclamation marks in reporting unless necessary or inside a quotation.', [{ text: '.', label: '.' }]);
    });
    each(/\?/g, function (m) {
      if (/[!?]/.test(T[m.index - 1] || '') || /[!?]/.test(T[m.index + 1] || '')) return;
      if (inQuote(m.index)) return;
      add('excl-question', m.index, m.index + 1, 'Avoid question marks in reporting unless necessary or inside a quotation.', []);
    });

    /* ---------- Colon ---------- */
    each(/:[ \t]+([A-Z])([a-z]+)\b/g, function (m) {
      var before = T.slice(Math.max(0, m.index - 6), m.index);
      if (/(?:e\.g|i\.e)\.?$/i.test(before)) return;
      var word = m[1] + m[2], lower = m[1].toLowerCase() + m[2];
      var common = opts.spell ? (opts.spell(lower) && opts.spell(word)) : STOP.test(lower);
      if (!common) return;
      var s = m.index + m[0].length - word.length;
      add('colon-capital', s, s + 1, 'The first word after a colon is not capitalised (unless it is a proper noun).', [{ text: m[1].toLowerCase() }]);
    });

    /* ---------- Semicolon ---------- */
    (function semis() {
      for (var i = 0; i < T.length; i++) {
        if (T[i] !== ';') continue;
        var ls = i - 1; while (ls >= 0 && !/[;.!?\n]/.test(T[ls])) ls--;
        var re = i + 1; while (re < T.length && !/[;.!?\n]/.test(T[re])) re++;
        var left = T.slice(ls + 1, i), right = T.slice(i + 1, re);
        if (/,/.test(left) || /,/.test(right)) continue;
        if (/^\s*&/.test(right)) continue;
        var lw = (left.match(/[A-Za-z0-9’']+/g) || []).length, rw = (right.match(/[A-Za-z0-9’']+/g) || []).length;
        var conj = /^\s*(and|but|or|so|which|because|who|whom|whose|that|while|although|though|if|when|as|than|for|nor|yet)\b/i.test(right);
        if (conj) add('semi-misuse', i, i + 1, 'A semicolon joins two complete sentences. The words after it start with a conjunction or relative word; use a comma or start a new sentence.', [{ text: ',' }]);
        else if (lw < 3 || rw < 3) add('semi-misuse', i, i + 1, 'One side of this semicolon looks like a fragment. A semicolon joins two complete sentences that complement each other.', [{ text: ',' }]);
      }
    })();

    /* ---------- Parentheses ---------- */
    each(/\(([^()\n]+)\)/g, function (m) {
      var inner = m[1], s = m.index, e = s + m[0].length;
      var trimmed = inner.trim();
      var words = trimmed.split(/\s+/);
      if (/^(e\.g|i\.e|cf|see|etc|viz)/i.test(trimmed)) return;
      var allCap = words.every(function (w) { return /^[A-Z0-9]/.test(w) || /^(of|the|and|for|in|on|to|a|an)$/i.test(w); });
      if (/^[a-z]/.test(trimmed) && /[.!?]$/.test(trimmed)) {
        add('paren-terminal', s + 1 + inner.length - 1, s + 1 + inner.length, 'A fragment inside parentheses takes no terminal punctuation.', [{ text: '' }]);
        return;
      }
      if (/^[A-Z]/.test(trimmed) && words.length >= 4 && !/[.!?…]$/.test(trimmed) && !allCap) {
        add('paren-sentence', s + 1 + inner.length, s + 1 + inner.length, 'If this is a full sentence, end it with a full stop inside the parentheses. If it is a fragment, do not capitalise it.', [{ s: s + 1 + inner.length, e: s + 1 + inner.length, text: '.', label: 'Add “.”' }]);
        return;
      }
      if (/^[a-z]/.test(trimmed) && words.length >= 3 && s > 0 && T[s - 1] === ' ') {
        var nextCh = T[e] || '';
        var fixes;
        if (/[.,;:!?]/.test(nextCh)) fixes = [{ s: s - 1, e: e, text: '—' + trimmed, label: '—' + (trimmed.length > 14 ? trimmed.slice(0, 12) + '…' : trimmed) }, { s: s - 1, e: e, text: ', ' + trimmed, label: ', …' }];
        else fixes = [{ s: s - 1, e: e, text: '—' + trimmed + '—', label: '—…—' }, { s: s - 1, e: e, text: ', ' + trimmed + ',', label: ', …,' }];
        add('paren-aside', s, e, 'Commas or em dashes are preferred over parentheses for an interjected aside.', fixes);
      }
    });

    /* ---------- Numbers ---------- */
    each(/\d+/g, function (m) {
      var s = m.index, e = s + m[0].length, tok = m[0];
      if (tok.length > 2 || (tok.length === 2 && tok[0] === '0')) return;
      var v = parseInt(tok, 10);
      if (v > 19) return;
      var p = T[s - 1] || '', n1 = T[e] || '', n2 = T[e + 1] || '';
      if (/[.,:\/\-–—’‘$£€₹#@+°_%&A-Za-z\d]/.test(p)) return;
      if (/[:\/%°\-–—]/.test(n1)) return;
      if ((n1 === '.' || n1 === ',') && /\d/.test(n2)) return;
      if (/[A-Za-z’]/.test(n1)) return;
      if (inZone(s)) return;
      var lineStart = T.lastIndexOf('\n', s - 1) + 1;
      if (/^\s*$/.test(T.slice(lineStart, s)) && /^[.)]/.test(n1)) return;
      var pw = (/([A-Za-z]+)\.?\s*$/.exec(T.slice(Math.max(0, s - 14), s)) || [])[1] || '';
      if (LABELS.test(pw) || MONTHS_RE.test(pw)) return;
      var nw = ((/^\s*([A-Za-z.µ]+)/.exec(T.slice(e, e + 14)) || [])[1] || '').replace(/\.+$/, '');
      if (nw && (UNIT_AFTER.test(nw) || MONTHS_RE.test(nw))) return;
      var word = NUM_WORDS[v];
      if (sentStart[s]) word = cap(word);
      add('num-small', s, e, 'Write numbers below 20 as words (' + word.toLowerCase() + ') unless they are a mark, score, rank or fixed format.', [{ text: word }]);
    });
    each(/\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[-\s](one|two|three|four|five|six|seven|eight|nine)\b)?/gi, function (m) {
      var rest = T.slice(m.index + m[0].length, m.index + m[0].length + 8);
      if (!m[2] && /^-[a-z]/i.test(rest)) return;
      if (m[2] && /^-[a-z]/i.test(rest)) return;
      var val = TENS[m[1].toLowerCase()] + (m[2] ? UNITS[m[2].toLowerCase()] : 0);
      add('num-big-word', m.index, m.index + m[0].length, 'Write numbers above nineteen as figures (' + val + ').', [{ text: String(val) }]);
    });
    each(/\b\d{1,2}(?:,\d{2})+,\d{3}\b/g, function (m) {
      var plain = m[0].replace(/,/g, '');
      add('num-indian', m.index, m.index + m[0].length, 'Group digits in threes (' + groupDigits(plain) + '), not in the lakh–crore pattern.', [{ text: groupDigits(plain) }]);
    });
    each(/\b\d{1,3}(?:\.\d{3}){2,}\b/g, function (m) {
      var plain = m[0].replace(/\./g, '');
      add('num-grouping', m.index, m.index + m[0].length, 'Use commas to group digits: ' + groupDigits(plain) + '.', [{ text: groupDigits(plain) }]);
    });
    each(/(?:^|[^\d,.])(\d{1,3}(?: \d{3}){2,})(?![\d,])/g, function (m) {
      var num = m[1], s = m.index + m[0].length - num.length;
      var plain = num.replace(/ /g, '');
      add('num-grouping', s, s + num.length, 'Use commas to group digits: ' + groupDigits(plain) + '.', [{ text: groupDigits(plain) }]);
    });
    each(/\b\d{5,15}\b/g, function (m) {
      var s = m.index, e = s + m[0].length;
      if (/[.,+\-_\/#@]/.test(T[s - 1] || '') || /[\-_\/@]/.test(T[e] || '')) return;
      if (/^0/.test(m[0])) return;
      if (inZone(s)) return;
      var plain = m[0], fixes = [];
      var big = bigName(plain);
      if (big) fixes.push({ text: big });
      fixes.push({ text: groupDigits(plain) });
      add('num-grouping', s, e, 'Group digits in threes with commas (' + groupDigits(plain) + ').', fixes);
    });
    function bigName(plain) {
      var scales = [[12, 'trillion'], [9, 'billion']];
      for (var i = 0; i < scales.length; i++) {
        var k = scales[i][0];
        if (plain.length > k) {
          var head = plain.slice(0, plain.length - k), tail = plain.slice(plain.length - k);
          if (/^0+$/.test(tail) && head.length <= 3) return head + ' ' + scales[i][1];
        }
      }
      return '';
    }
    each(/\b\d{1,3}(?:,\d{3}){3,}\b/g, function (m) {
      var plain = m[0].replace(/,/g, '');
      var big = bigName(plain);
      if (big) add('num-large', m.index, m.index + m[0].length, 'Large powers of ten read better with their names: ' + big + '.', [{ text: big }]);
    });

    /* ---------- Spacing & marks ---------- */
    each(/(\S)( {2,})(?=\S)/g, function (m) {
      var s = m.index + 1;
      add('sp-double', s, s + m[2].length, 'Use a single space.', [{ text: ' ', label: 'one space' }]);
    });
    each(/(\S)([ \t]+)([,.;:!?])(?=\s|$|[”’)])/g, function (m) {
      if (m[1] === '.' && m[3] === '.') return;
      var s = m.index + 1;
      add('sp-before', s, s + m[2].length, 'Remove the space before “' + m[3] + '”.', [{ text: '' }]);
    });
    each(/(\S)([ \t]+),(?=[A-Za-z])/g, function (m) {
      var s = m.index + 1;
      add('sp-before', s, s + m[2].length + 1, 'Remove the space before the comma and add one after it.', [{ text: ', ', label: ', ' }]);
    });
    each(/([A-Za-z]{2,}),(?=[A-Za-z])/g, function (m) {
      if (inZone(m.index)) return;
      var s = m.index + m[1].length;
      add('sp-after', s, s + 1, 'Add a space after the comma.', [{ text: ', ' }]);
    });
    each(/([A-Za-z]{2,});(?=[A-Za-z])/g, function (m) {
      var s = m.index + m[1].length;
      add('sp-after', s, s + 1, 'Add a space after the semicolon.', [{ text: '; ' }]);
    });
    each(/\b([a-z]{2,})([.!?])(?=[A-Z][a-z])/g, function (m) {
      if (inZone(m.index)) return;
      var s = m.index + m[1].length;
      add('sp-after', s, s + 1, 'Add a space after the sentence end.', [{ text: m[2] + ' ' }]);
    });
    each(/[a-z]{2,}:(?=[A-Za-z])/g, function (m) {
      if (/^(https?|mailto|ftp|tel|file):$/i.test(m[0]) || inZone(m.index)) return;
      var s = m.index + m[0].length - 1;
      add('sp-after', s, s + 1, 'Add a space after the colon.', [{ text: ': ' }]);
    });
    each(/(,{2,}|;{2,}|:{2,})/g, function (m) {
      add('sp-repeat', m.index, m.index + m[0].length, 'Repeated punctuation.', [{ text: m[0][0] }]);
    });
    (function brackets() {
      var stack = [], i, c;
      for (i = 0; i < T.length; i++) {
        c = T[i];
        if (c === '(' || c === '[') stack.push([c, i]);
        else if (c === ')' || c === ']') {
          var want = c === ')' ? '(' : '[';
          if (stack.length && stack[stack.length - 1][0] === want) stack.pop();
          else {
            var ls = T.lastIndexOf('\n', i - 1) + 1;
            if (c === ')' && /^\s*[A-Za-z0-9]{1,3}$/.test(T.slice(ls, i))) continue;
            add('sp-brackets', i, i + 1, 'This closing “' + c + '” has no matching opening bracket.', []);
          }
        }
      }
      stack.forEach(function (o) { add('sp-brackets', o[1], o[1] + 1, 'This opening “' + o[0] + '” is never closed.', []); });
      var open = -1;
      for (i = 0; i < T.length; i++) {
        if (T[i] === '“') { if (open >= 0) add('sp-brackets', open, open + 1, 'This opening quotation mark is never closed.', []); open = i; }
        else if (T[i] === '”') { if (open < 0) add('sp-brackets', i, i + 1, 'This closing quotation mark has no opening partner.', []); else open = -1; }
      }
      if (open >= 0) add('sp-brackets', open, open + 1, 'This opening quotation mark is never closed.', []);
    })();

    /* ---------- Grammar ---------- */
    each(/\b([A-Za-z’]+)(\s+)\1\b/gi, function (m) {
      var lw = m[1].toLowerCase();
      if (lw === 'had' || lw === 'that' || lw === 'is') return;
      if (/^\d+$/.test(lw)) return;
      var s = m.index + m[1].length;
      add('g-repeat', s, m.index + m[0].length, 'The word “' + m[1] + '” is repeated.', [{ text: '', label: 'Delete repeat' }]);
    });
    each(/\b(a|an)(\s+)([A-Za-z0-9][\w’-]*)/gi, function (m) {
      var art = m[1], next = m[3];
      if (/^(and|or|nor|but)$/i.test(next)) return;
      if (/[’']/.test(T[m.index - 1] || '')) return;
      if (art === 'A' && /^[A-Z]\b/.test(next) && next.length === 1) return;
      var vowel = startsVowelSound(next);
      var wantAn = vowel;
      if (art.toLowerCase() === 'an' && !wantAn) add('g-article', m.index, m.index + art.length, 'Use “' + matchCase(art, 'a') + '” before “' + next + '”, which starts with a consonant sound.', [{ text: matchCase(art, 'a') }]);
      else if (art.toLowerCase() === 'a' && wantAn) add('g-article', m.index, m.index + art.length, 'Use “' + matchCase(art, 'an') + '” before “' + next + '”, which starts with a vowel sound.', [{ text: matchCase(art, 'an') }]);
    });
    each(/\b(its)\s+(a|an|the|been|not|going|very|so|just|also|too|always|never|being|such|only|about|still|now)\b/gi, function (m) {
      add('g-its', m.index, m.index + 3, '“its” shows possession. Here you probably mean “it’s” (it is / it has).', [{ text: matchCase(m[1], 'it’s') }]);
    });
    each(/\b(it’s)\s+(own|owner|name|color|colour|purpose|size|shape|way|place)\b/gi, function (m) {
      add('g-its', m.index, m.index + 4, 'Here “its” (possessive) is needed, without an apostrophe.', [{ text: matchCase(m[1], 'its') }]);
    });
    each(/\b(your)\s+(welcome|not|a|an|the|so|very|too|always|never|right|wrong|able|gonna|really|sure|going to)\b/gi, function (m) {
      add('g-your', m.index, m.index + 4, '“your” shows possession. Here you probably mean “you’re” (you are).', [{ text: matchCase(m[1], 'you’re') }]);
    });
    each(/\b(you’re)\s+(own|name|car|house|home|friends?|family|work|job|team|life|book|idea|turn|phone|email|mother|father|parents|school|college|project)\b/gi, function (m) {
      add('g-your', m.index, m.index + 6, 'Here the possessive “your” is needed.', [{ text: matchCase(m[1], 'your') }]);
    });
    each(/\b(their)\s+(is|are|was|were|will|has|have|isn’t|aren’t|not|always|never|here)\b/gi, function (m) {
      add('g-their', m.index, m.index + 5, '“their” shows possession. Here you probably mean “there”.', [{ text: matchCase(m[1], 'there') }, { text: matchCase(m[1], 'they’re'), label: 'they’re' }]);
    });
    each(/\b(there|they’re)\s+(own|car|house|home|friends?|family|team|work|job|book|idea|turn|phone|mother|father|parents|school|college|project|names?)\b/gi, function (m) {
      add('g-their', m.index, m.index + m[1].length, 'Here the possessive “their” is needed.', [{ text: matchCase(m[1], 'their') }]);
    });
    each(/\b(could|would|should|must|might|may)\s+(of)\b/gi, function (m) {
      var s = m.index + m[0].length - 2;
      add('g-modal-of', s, s + 2, '“' + m[1] + ' of” should be “' + m[1] + ' have”.', [{ text: 'have' }]);
    });
    [
      [/\balot\b/gi, '“alot” is two words.', 'a lot'],
      [/\birregardless\b/gi, 'The standard word is “regardless”.', 'regardless'],
      [/\bfor all intensive purposes\b/gi, 'The idiom is “for all intents and purposes”.', 'for all intents and purposes'],
      [/\bcould care less\b/gi, 'The idiom is “couldn’t care less”.', 'couldn’t care less'],
      [/\bin regards to\b/gi, 'Use “in regard to” or “regarding”.', 'in regard to'],
      [/\bsupposably\b/gi, 'The word is “supposedly”.', 'supposedly'],
      [/\bnoone\b/gi, '“no one” is two words.', 'no one'],
      [/\binfact\b/gi, '“in fact” is two words.', 'in fact'],
      [/\bbased off of\b/gi, 'Use “based on”.', 'based on']
    ].forEach(function (p) {
      each(p[0], function (m) { add('g-phrase', m.index, m.index + m[0].length, p[1], [{ text: matchCase(m[0], p[2]) }]); });
    });
    each(/\b(?:am|is|are|was|were|be|been)\s+(suppose)\s+to\b/gi, function (m) {
      var s = m.index + m[0].indexOf(m[1], 1);
      add('g-phrase', s, s + m[1].length, 'The phrase is “supposed to”.', [{ text: 'supposed' }]);
    });
    each(/\b(?:I|we|you|they|he|she|it|who)\s+(use)\s+to\b/g, function (m) {
      var s = m.index + m[0].indexOf(m[1], 1);
      add('g-phrase', s, s + 3, 'The phrase is “used to”.', [{ text: 'used' }]);
    });
    each(/\bbetween\s+(?:you|him|her|them|us)\s+and\s+(I)\b/gi, function (m) {
      var s = m.index + m[0].length - 1;
      add('g-phrase', s, s + 1, 'After “between”, use the object form: “me”.', [{ text: 'me' }]);
    });
    each(/\b(more|less|better|worse|bigger|smaller|larger|greater|fewer|rather|other|higher|lower|faster|slower|easier|harder|older|younger|taller|shorter|longer)\s+(then)\b/gi, function (m) {
      var s = m.index + m[0].length - 4;
      add('g-than', s, s + 4, 'Use “than” for comparisons.', [{ text: 'than' }]);
    });
    each(/\b(he|she|it)\s+(are|were|have|don’t|do)\b/gi, function (m) {
      var pw = prevWord(m.index);
      if (AUX[pw] || /^(if|wish|as|though|that|whether|than)$/.test(pw)) return;
      var map = { are: 'is', were: 'was', have: 'has', 'don’t': 'doesn’t', do: 'does' };
      var v = m[2].toLowerCase(), s = m.index + m[0].length - m[2].length;
      add('g-agree', s, s + m[2].length, '“' + m[1] + '” takes a singular verb: “' + map[v] + '”.', [{ text: map[v] }]);
    });
    each(/\b(they|we|you)\s+(is|was|has|doesn’t|does)\b/gi, function (m) {
      var pw = prevWord(m.index);
      if (AUX[pw]) return;
      var map = { is: 'are', was: 'were', has: 'have', 'doesn’t': 'don’t', does: 'do' };
      var v = m[2].toLowerCase(), s = m.index + m[0].length - m[2].length;
      add('g-agree', s, s + m[2].length, '“' + m[1] + '” takes a plural verb: “' + map[v] + '”.', [{ text: map[v] }]);
    });
    each(/\bI\s+(is|are|has)\b/g, function (m) {
      var map = { is: 'am', are: 'am', has: 'have' }, s = m.index + m[0].length - m[1].length;
      add('g-agree', s, s + m[1].length, '“I” takes “' + map[m[1]] + '”.', [{ text: map[m[1]] }]);
    });
    each(/\b(these|those|many|several|both|few|various)\s+(?:[a-z]+\s+)?([a-z]+s)\s+(is|was|has)\b/gi, function (m) {
      var map = { is: 'are', was: 'were', has: 'have' }, v = m[3].toLowerCase(), s = m.index + m[0].length - m[3].length;
      add('g-agree', s, s + m[3].length, 'A plural subject takes a plural verb: “' + map[v] + '”.', [{ text: map[v] }]);
    });
    each(/\b(?:don’t|doesn’t|didn’t|can’t|won’t|couldn’t|wouldn’t|shouldn’t|hasn’t|haven’t|hadn’t)\s+(?:[a-z]+\s+)?(no|nothing|nobody|nowhere|never)\b/gi, function (m) {
      var s = m.index + m[0].length - m[1].length;
      add('g-double-neg', s, s + m[1].length, 'Double negative: the clause already contains a negative.', []);
    });
    each(/(^|[^\w’.\-])i(?=’(?:m|ll|d|ve)\b)/g, function (m) {
      var s = m.index + m[1].length;
      add('g-i', s, s + 1, 'Capitalise “I”.', [{ text: 'I' }]);
    });
    each(/(^|[^\w’.\-])i(?![\w.’\-])/g, function (m) {
      var s = m.index + m[1].length;
      add('g-i', s, s + 1, 'Capitalise “I”.', [{ text: 'I' }]);
    });
    each(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|april|june|july|september|october|november|december)\b/g, function (m) {
      add('g-proper-case', m.index, m.index + m[0].length, 'Days and months are capitalised.', [{ text: cap(m[0]) }]);
    });
    sents.forEach(function (sn) {
      var k = sn.start;
      while (k < sn.end && !/[A-Za-z0-9]/.test(T[k])) k++;
      if (k >= sn.end || !/[a-z]/.test(T[k])) return;
      var tok = /^[A-Za-z]+/.exec(T.slice(k, k + 30))[0];
      if (tok === 'i' && !/[A-Za-z.]/.test(T[k + 1] || '')) return;
      if (tok === 'i' && T[k + 1] === '’') return;
      if (/^[a-z][A-Z]/.test(T.slice(k, k + 2)) || /^(e|i|a|b|c|d)$/.test(tok) && /[.)]/.test(T[k + 1] || '')) return;
      if (/^(e\.g|i\.e)/i.test(T.slice(k, k + 4))) return;
      if (inZone(k)) return;
      add('g-sentence-case', k, k + 1, 'A sentence starts with a capital letter.', [{ text: T[k].toUpperCase() }]);
    });

    /* Resolve: drop duplicates, sort */
    var seen = {}, res = [];
    out.sort(function (a, b) { return a.start - b.start || a.end - b.end; });
    out.forEach(function (it) {
      var key = it.rule + ':' + it.start + ':' + it.end;
      if (seen[key]) return;
      seen[key] = 1;
      it.id = res.length;
      res.push(it);
    });
    // Guard against fix ranges outside the text
    res.forEach(function (it) { it.fixes = it.fixes.filter(function (f) { return f.start >= 0 && f.end <= text.length && f.start <= f.end; }); });
    return res;
  }

  function stats(text) {
    var words = (text.match(/[A-Za-z0-9’']+(?:[-–][A-Za-z0-9’']+)*/g) || []).length;
    var sentences = splitSentences(norm(text)).length;
    return { words: words, sentences: sentences };
  }

  var API = { check: check, stats: stats, RULES: RULES, CATS: CATS, norm: norm };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.FP = API;
})(typeof window !== 'undefined' ? window : globalThis);
