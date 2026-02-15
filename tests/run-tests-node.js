#!/usr/bin/env node
/**
 * Headless test runner using Node.js
 * Runs unit tests for shared modules (constants, i18n, diff-engine, api-client)
 *
 * Strategy: Use Function() constructor to eval module code with explicit global assignment
 */

const fs = require('fs');
const path = require('path');

// ============ COLORS ============
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// ============ LOAD AND EXECUTE MODULES ============
const rootDir = path.resolve(__dirname, '..');

function loadAndExec(filePath) {
  const src = fs.readFileSync(path.join(rootDir, filePath), 'utf-8');
  // Replace `const XXX =` with `global.XXX =` at top-level to make accessible
  const modified = src.replace(/^const (\w+)\s*=/m, 'global.$1 =');
  new Function(modified)();
}

// Mock chrome.storage for i18n module
global.chrome = { storage: { sync: { get: (k, cb) => cb && cb({}) } } };

loadAndExec('shared/constants.js');
loadAndExec('shared/i18n.js');
loadAndExec('shared/diff-engine.js');
loadAndExec('shared/api-client.js');

const { XRAY, I18n, DiffEngine, APIClient } = global;

// ============ TEST FRAMEWORK ============
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];
let currentSuiteName = '';

function suite(name) {
  currentSuiteName = name;
  console.log(`\n${CYAN}${BOLD}▸ ${name}${RESET}`);
}

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ${GREEN}✓${RESET} ${name}`);
  } catch (err) {
    failedTests++;
    failures.push({ suite: currentSuiteName, test: name, error: err.message });
    console.log(`  ${RED}✗${RESET} ${name}`);
    console.log(`    ${RED}${err.message}${RESET}`);
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    throw new Error(`${msg || 'assertEqual'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ============ TEST SUITES ============

// ---- Constants ----
suite('Constants');

test('XRAY object exists', () => assert(typeof XRAY === 'object'));
test('DELAY values positive', () => {
  assert(XRAY.DELAY.BETWEEN_ENTITIES > 0);
  assert(XRAY.DELAY.AFTER_ACTION > 0);
  assert(XRAY.DELAY.RETRY_BASE > 0);
});
test('LIMITS reasonable', () => {
  assertEqual(XRAY.LIMITS.MAX_DESCRIPTION, 1175);
  assert(XRAY.LIMITS.MAX_RETRIES >= 1);
  assert(XRAY.LIMITS.ELEMENT_TIMEOUT >= 1000);
});
test('SEL selectors are strings', () => {
  assert(typeof XRAY.SEL.ENTITY_ITEM === 'string');
  assert(typeof XRAY.SEL.ENTITY_NAME === 'string');
  assert(typeof XRAY.SEL.DONE_SWITCH === 'string');
});
test('MSG actions are strings', () => {
  assert(typeof XRAY.MSG.PING === 'string');
  assert(typeof XRAY.MSG.BATCH_PROCESS === 'string');
});
test('All SEL keys non-empty', () => {
  for (const k of Object.keys(XRAY.SEL)) assert(XRAY.SEL[k].length > 0, `SEL.${k}`);
});
test('All MSG keys non-empty', () => {
  for (const k of Object.keys(XRAY.MSG)) assert(XRAY.MSG[k].length > 0, `MSG.${k}`);
});

// ---- I18n ----
suite('I18n');

test('Lang is en', () => assertEqual(I18n.getLang(), 'en'));
test('t() returns string', () => assertEqual(I18n.t('app_name'), 'KDP X-Ray Helper'));
test('t() placeholders', () => assert(I18n.t('status_ready', 42).includes('42')));
test('Unknown key → key', () => assertEqual(I18n.t('no_such_key'), 'no_such_key'));
test('All keys defined', () => {
  for (const k of ['app_name', 'tab_import', 'tab_diff', 'tab_execute', 'tab_log', 'btn_validate', 'btn_compare', 'btn_export', 'btn_copy_prompt', 'step1_label', 'step2_label', 'btn_gen_prompt', 'upload_hint', 'import_or_paste', 'prompt_generated', 'quick_export', 'valid_ok_full']) {
    assert(I18n.t(k) !== k, `${k} not defined`);
  }
});

// ---- Levenshtein ----
suite('Levenshtein Distance');

test('Identical = 0', () => assertEqual(DiffEngine.levenshtein('hello', 'hello'), 0));
test('Empty vs non-empty', () => {
  assertEqual(DiffEngine.levenshtein('', 'abc'), 3);
  assertEqual(DiffEngine.levenshtein('abc', ''), 3);
});
test('Both empty = 0', () => assertEqual(DiffEngine.levenshtein('', ''), 0));
test('Single sub = 1', () => assertEqual(DiffEngine.levenshtein('cat', 'bat'), 1));
test('Single ins = 1', () => assertEqual(DiffEngine.levenshtein('cat', 'cats'), 1));
test('kitten→sitting = 3', () => assertEqual(DiffEngine.levenshtein('kitten', 'sitting'), 3));
test('Case sensitive', () => assert(DiffEngine.levenshtein('Hello', 'hello') > 0));
test('Symmetric', () => assertEqual(DiffEngine.levenshtein('abc', 'xyz'), DiffEngine.levenshtein('xyz', 'abc')));

// ---- Similarity ----
suite('Similarity Score');

test('Identical = 1.0', () => assertEqual(DiffEngine.similarity('Kyle Chen', 'Kyle Chen'), 1.0));
test('Case insensitive = 1.0', () => assertEqual(DiffEngine.similarity('Kyle Chen', 'kyle chen'), 1.0));
test('Similar > 0.7', () => assert(DiffEngine.similarity('Kyle Chen', 'Kyle Chan') > 0.7));
test('Different < 0.5', () => assert(DiffEngine.similarity('Kyle Chen', 'Shadowlands') < 0.5));
test('Empty = 0', () => {
  assertEqual(DiffEngine.similarity('', 'hello'), 0);
  assertEqual(DiffEngine.similarity('hello', ''), 0);
});
test('Both empty = 1.0', () => assertEqual(DiffEngine.similarity('', ''), 1.0));

// ---- Partial Match ----
suite('Partial Match');

test('Kyle in Kyle Chen', () => assert(DiffEngine.partialMatch('Kyle', 'Kyle Chen') > 0));
test('Smith in Dr. Smith', () => assert(DiffEngine.partialMatch('Dr. Smith', 'Smith') > 0));
test('No match = 0', () => assertEqual(DiffEngine.partialMatch('Apple', 'Banana'), 0));

// ---- Alias Match ----
suite('Alias Matching');

test('Exact alias = 1.0', () => assertEqual(DiffEngine.aliasMatch('Kyle', ['Kyle', 'Mr. Chen']), 1.0));
test('Fuzzy alias > 0.8', () => assert(DiffEngine.aliasMatch('Mr Chen', ['Kyle', 'Mr. Chen']) > 0.8));
test('No alias = 0', () => assertEqual(DiffEngine.aliasMatch('Banana', ['Kyle', 'Mr. Chen']), 0));
test('Empty aliases = 0', () => {
  assertEqual(DiffEngine.aliasMatch('Kyle', []), 0);
  assertEqual(DiffEngine.aliasMatch('Kyle', null), 0);
});

// ---- Find Best Match ----
suite('Find Best Match');

const kdp = [
  { name: 'Kyle Chen', type: 'CHARACTER', aliases: ['Kyle', 'Mr. Chen'] },
  { name: 'Sarah Lin', type: 'CHARACTER', aliases: ['Sarah'] },
  { name: 'Shadowlands', type: 'TOPIC', aliases: ['Shadow Realm'] },
];

test('Exact match', () => {
  const r = DiffEngine.findBestMatch({ name: 'Kyle Chen' }, kdp);
  assert(r !== null);
  assertEqual(r.kdpEntity.name, 'Kyle Chen');
  assertEqual(r.matchType, 'exact');
});
test('Case insensitive', () => {
  const r = DiffEngine.findBestMatch({ name: 'kyle chen' }, kdp);
  assert(r !== null);
  assertEqual(r.kdpEntity.name, 'Kyle Chen');
});
test('Alias match', () => {
  const r = DiffEngine.findBestMatch({ name: 'Shadow Realm' }, kdp);
  assert(r !== null);
  assertEqual(r.kdpEntity.name, 'Shadowlands');
});
test('No match → null', () => assertEqual(DiffEngine.findBestMatch({ name: 'Unknown XYZ' }, kdp), null));
test('Fuzzy typo match', () => {
  const r = DiffEngine.findBestMatch({ name: 'Kile Chen' }, kdp, 0.7);
  assert(r !== null);
  assertEqual(r.kdpEntity.name, 'Kyle Chen');
});

// ---- Generate Diff ----
suite('Generate Diff');

const imp = [
  { name: 'Kyle Chen', type: 'CHARACTER', description: 'Updated', action: 'update' },
  { name: 'Sarah Lin', type: 'CHARACTER', description: 'Same', action: 'update' },
  { name: 'Bob', type: 'CHARACTER', action: 'delete' },
  { name: 'New', type: 'CHARACTER', description: 'Brand new', action: 'update' },
];
const kdpD = [
  { name: 'Kyle Chen', type: 'CHARACTER', description: 'Old' },
  { name: 'Sarah Lin', type: 'CHARACTER', description: 'Same' },
  { name: 'Bob', type: 'CHARACTER', description: '' },
  { name: 'Shadowlands', type: 'TOPIC', description: 'A realm' },
];

test('Returns array', () => {
  const d = DiffEngine.generateDiff(imp, kdpD);
  assert(Array.isArray(d) && d.length > 0);
});
test('Kyle = update', () => {
  const d = DiffEngine.generateDiff(imp, kdpD);
  const k = d.find(x => x.name === 'Kyle Chen');
  assertEqual(k.action, 'update');
  assert(k.changes.some(c => c.field === 'description'));
});
test('Sarah = keep', () => {
  assertEqual(DiffEngine.generateDiff(imp, kdpD).find(x => x.name === 'Sarah Lin').action, 'keep');
});
test('Bob = delete', () => {
  assertEqual(DiffEngine.generateDiff(imp, kdpD).find(x => x.name === 'Bob').action, 'delete');
});
test('New = import_only', () => {
  assertEqual(DiffEngine.generateDiff(imp, kdpD).find(x => x.name === 'New').source, 'import_only');
});
test('Shadowlands = kdp_only', () => {
  const d = DiffEngine.generateDiff(imp, kdpD, { showUnmatched: true });
  assertEqual(d.find(x => x.name === 'Shadowlands').source, 'kdp_only');
});
test('getDiffStats', () => {
  const s = DiffEngine.getDiffStats(DiffEngine.generateDiff(imp, kdpD, { showUnmatched: true }));
  assert(s.total > 0 && s.updates >= 1 && s.deletes >= 1);
});

// ---- Normalize Type ----
suite('Normalize Type');

test('CHARACTER→CHARACTER', () => assertEqual(DiffEngine.normalizeType('CHARACTER'), 'CHARACTER'));
test('TERM→TERM', () => assertEqual(DiffEngine.normalizeType('TERM'), 'TERM'));
test('TOPIC→TERM', () => assertEqual(DiffEngine.normalizeType('TOPIC'), 'TERM'));
test('character→CHARACTER', () => assertEqual(DiffEngine.normalizeType('character'), 'CHARACTER'));
test('CHAR→CHARACTER', () => assertEqual(DiffEngine.normalizeType('CHAR'), 'CHARACTER'));
test('null→empty', () => {
  assertEqual(DiffEngine.normalizeType(''), '');
  assertEqual(DiffEngine.normalizeType(null), '');
});

// ---- Edge Cases ----
suite('Edge Cases');

test('Empty+Empty=empty', () => assertEqual(DiffEngine.generateDiff([], []).length, 0));
test('Empty+KDP=kdp_only', () => {
  const d = DiffEngine.generateDiff([], [{ name: 'A', type: 'CHARACTER' }], { showUnmatched: true });
  assertEqual(d.length, 1);
  assertEqual(d[0].source, 'kdp_only');
});
test('Import+Empty=import_only', () => {
  const d = DiffEngine.generateDiff([{ name: 'A', type: 'CHARACTER', action: 'update' }], []);
  assertEqual(d.length, 1);
  assertEqual(d[0].source, 'import_only');
});
test('Unicode names', () => {
  const d = DiffEngine.generateDiff(
    [{ name: '张三', type: 'CHARACTER', description: '主角', action: 'update' }],
    [{ name: '张三', type: 'CHARACTER', description: '' }]
  );
  assertEqual(d.find(x => x.name === '张三').source, 'both');
});
test('Long description', () => {
  const d = DiffEngine.generateDiff(
    [{ name: 'T', type: 'CHARACTER', description: 'A'.repeat(2000), action: 'update' }],
    [{ name: 'T', type: 'CHARACTER', description: 'S' }]
  );
  assert(d.find(x => x.name === 'T').changes.some(c => c.field === 'description'));
});
test('Missing KDP type no false update', () => {
  // When KDP entity has no type (quick export), should NOT flag type as a change
  const d = DiffEngine.generateDiff(
    [{ name: 'A', type: 'CHARACTER', description: 'Desc', action: 'update' }],
    [{ name: 'A', description: 'Desc' }]
  );
  const item = d.find(x => x.name === 'A');
  assertEqual(item.action, 'keep');
  assert(!item.changes.some(c => c.field === 'type'), 'Should not have type change');
});
test('Real type diff detected', () => {
  // When both types are known and different, SHOULD flag as change
  const d = DiffEngine.generateDiff(
    [{ name: 'A', type: 'CHARACTER', description: 'Desc', action: 'update' }],
    [{ name: 'A', type: 'TERM', description: 'Desc' }]
  );
  const item = d.find(x => x.name === 'A');
  assertEqual(item.action, 'update');
  assert(item.changes.some(c => c.field === 'type'), 'Should have type change');
});

// ---- API Client (Utility functions) ----
suite('API Client Utilities');

test('APIClient exists', () => assert(typeof APIClient === 'object'));
test('Has utility methods', () => {
  assert(typeof APIClient.chunkText === 'function');
  assert(typeof APIClient.parseEntityJSON === 'function');
});
test('chunkText splits', () => {
  const c = APIClient.chunkText('Hello World. '.repeat(1000), 5000);
  assert(c.length > 1);
});
test('chunkText short', () => {
  assertEqual(APIClient.chunkText('Short.', 5000).length, 1);
});
test('parseEntityJSON: array', () => {
  const r = APIClient.parseEntityJSON('[{"name":"A","type":"CHARACTER"}]');
  assert(Array.isArray(r));
  assertEqual(r[0].name, 'A');
});
test('parseEntityJSON: markdown', () => {
  const r = APIClient.parseEntityJSON('```json\n[{"name":"B","type":"TERM"}]\n```');
  assertEqual(r[0].name, 'B');
});
test('parseEntityJSON: extra text', () => {
  const r = APIClient.parseEntityJSON('Here:\n[{"name":"C","type":"CHARACTER"}]\nDone');
  assertEqual(r[0].name, 'C');
});

// ============ SUMMARY ============
console.log('\n' + '='.repeat(50));
if (failedTests === 0) {
  console.log(`${GREEN}${BOLD}ALL PASS: ${passedTests}/${totalTests} tests passed ✓${RESET}`);
} else {
  console.log(`${RED}${BOLD}FAILED: ${passedTests}/${totalTests} passed, ${failedTests} failed${RESET}`);
  console.log(`\n${RED}Failed tests:${RESET}`);
  for (const f of failures) {
    console.log(`  ${RED}  [${f.suite}] ${f.test}: ${f.error}${RESET}`);
  }
}
console.log('='.repeat(50));
process.exit(failedTests > 0 ? 1 : 0);
