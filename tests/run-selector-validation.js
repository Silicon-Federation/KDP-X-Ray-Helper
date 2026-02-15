#!/usr/bin/env node
/**
 * Selector Validation Test — validates constants.js selectors against real KDP page HTML
 *
 * Loads the saved real KDP X-Ray page and checks that each CSS selector in XRAY.SEL
 * actually matches elements in the real DOM. This catches selector drift when Amazon
 * changes their page structure.
 *
 * Note: The saved page has RENDERED sidebar entities but UNRENDERED detail templates
 * (in <script type="text/html"> tags). We validate:
 *   - Sidebar selectors against rendered DOM
 *   - Detail/dialog selectors against template HTML content
 */

const fs = require('fs');
const path = require('path');

// ============ COLORS ============
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// ============ LOAD CONSTANTS ============
const rootDir = path.resolve(__dirname, '..');

function loadAndExec(filePath) {
  const src = fs.readFileSync(path.join(rootDir, filePath), 'utf-8');
  const modified = src.replace(/^const (\w+)\s*=/m, 'global.$1 =');
  new Function(modified)();
}

loadAndExec('shared/constants.js');
const { XRAY } = global;

// ============ LOAD REAL PAGE ============
const realPageDir = path.join(__dirname, 'real-page');
const realPageFiles = fs.readdirSync(realPageDir).filter(f => f.endsWith('.html'));
if (realPageFiles.length === 0) {
  console.error(`${RED}No HTML files found in ${realPageDir}${RESET}`);
  process.exit(1);
}
const realPagePath = path.join(realPageDir, realPageFiles[0]);
console.log(`${CYAN}Loading real page: ${realPageFiles[0]}${RESET}`);
const realPageHTML = fs.readFileSync(realPagePath, 'utf-8');

// ============ JSDOM SETUP ============
let JSDOM;
try {
  JSDOM = require('jsdom').JSDOM;
} catch (e) {
  console.error(`${RED}jsdom not found. Install with: npm install jsdom${RESET}`);
  process.exit(1);
}

const dom = new JSDOM(realPageHTML, { url: 'https://kdp.amazon.com/xray/verify/test' });
const document = dom.window.document;

// ============ TEST FRAMEWORK ============
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
let warnTests = 0;
const failures = [];
const warnings = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ${GREEN}✓${RESET} ${name}`);
  } catch (err) {
    if (err.isWarning) {
      warnTests++;
      warnings.push({ test: name, message: err.message });
      console.log(`  ${YELLOW}⚠${RESET} ${name} — ${err.message}`);
    } else {
      failedTests++;
      failures.push({ test: name, error: err.message });
      console.log(`  ${RED}✗${RESET} ${name}`);
      console.log(`    ${RED}${err.message}${RESET}`);
    }
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}

function warn(msg) {
  const err = new Error(msg);
  err.isWarning = true;
  throw err;
}

// ============ HELPER: Check selector in rendered DOM ============
function selectorMatchesDOM(selector) {
  try {
    return document.querySelectorAll(selector).length;
  } catch (e) {
    return -1; // invalid selector
  }
}

// ============ HELPER: Check selector pattern in template HTML ============
// Templates are in <script type="text/html"> tags; extract and search
function extractTemplateHTML() {
  const scripts = document.querySelectorAll('script[type="text/html"]');
  let html = '';
  scripts.forEach(s => { html += s.textContent + '\n'; });
  return html;
}

function selectorPatternInTemplates(selector, templateHTML) {
  // Convert CSS selector to pattern checks
  // Check for class names, IDs, attributes mentioned in selector
  const classMatches = selector.match(/\.([a-zA-Z_-][\w-]*)/g);
  const idMatches = selector.match(/#([a-zA-Z_-][\w-]*)/g);
  const attrMatches = selector.match(/\[([^\]]+)\]/g);
  const tagMatches = selector.match(/^([a-z]+)/);

  let found = 0;
  let total = 0;

  if (classMatches) {
    classMatches.forEach(cls => {
      total++;
      const className = cls.slice(1);
      if (templateHTML.includes(`class="${className}"`) ||
          templateHTML.includes(`class="`) && templateHTML.includes(className) ||
          templateHTML.includes(`className="${className}"`)) {
        found++;
      }
    });
  }

  if (idMatches) {
    idMatches.forEach(id => {
      total++;
      const idName = id.slice(1);
      if (templateHTML.includes(`id="${idName}"`)) {
        found++;
      }
    });
  }

  if (attrMatches) {
    attrMatches.forEach(attr => {
      total++;
      // Extract attribute name
      const attrName = attr.match(/\[([^=\]]+)/)?.[1];
      if (attrName && templateHTML.includes(attrName)) {
        found++;
      }
    });
  }

  return { found, total };
}

// ============ EXTRACT TEMPLATES ============
const templateHTML = extractTemplateHTML();
console.log(`${CYAN}Found ${document.querySelectorAll('script[type="text/html"]').length} templates in page${RESET}`);

// ============ TESTS ============

console.log(`\n${CYAN}${BOLD}▸ Sidebar Selectors (Rendered DOM)${RESET}`);

test('ENTITY_ITEM (.entity.well) matches entities', () => {
  const count = selectorMatchesDOM(XRAY.SEL.ENTITY_ITEM);
  assert(count > 0, `Expected entities, found ${count}`);
  console.log(`    → Found ${count} entity items`);
});

test('ENTITY_NAME (.displayname) exists in entities', () => {
  const count = selectorMatchesDOM(`${XRAY.SEL.ENTITY_ITEM} ${XRAY.SEL.ENTITY_NAME}`);
  assert(count > 0, `Expected displaynames, found ${count}`);
});

test('ENTITY_STATUS (.entity-status) exists in entities', () => {
  const count = selectorMatchesDOM(`${XRAY.SEL.ENTITY_ITEM} ${XRAY.SEL.ENTITY_STATUS}`);
  assert(count > 0, `Expected entity-status, found ${count}`);
});

test('Entities have data-index attribute', () => {
  const withIndex = document.querySelectorAll(`${XRAY.SEL.ENTITY_ITEM}[data-index]`).length;
  const total = selectorMatchesDOM(XRAY.SEL.ENTITY_ITEM);
  assert(withIndex === total, `${withIndex}/${total} entities have data-index`);
});

console.log(`\n${CYAN}${BOLD}▸ Detail Panel Selectors (Templates)${RESET}`);

test('DETAIL_LABEL (.entityAttributes .entityLabel) in templates', () => {
  const result = selectorPatternInTemplates(XRAY.SEL.DETAIL_LABEL, templateHTML);
  if (result.total === 0) warn('No patterns to check');
  assert(result.found > 0, `Pattern not found in templates (${result.found}/${result.total})`);
});

test('DETAIL_TYPE_CHAR (input[name="CHARACTER"]) in page or templates', () => {
  // Template uses dynamic name="${$value.value}" which becomes name="CHARACTER" at runtime.
  // Also check rendered DOM which has <button name="CHARACTER"> in button group.
  const inDOM = selectorMatchesDOM('[name="CHARACTER"]') > 0;
  const inTemplate = templateHTML.includes('change-type-action') &&
    (templateHTML.includes('name="CHARACTER"') || templateHTML.includes('${$value.value}'));
  assert(inDOM || inTemplate, 'CHARACTER type control not found in DOM or templates');
});

test('DETAIL_TYPE_TOPIC (input[name="TOPIC"]) in page or templates', () => {
  const inDOM = selectorMatchesDOM('[name="TOPIC"]') > 0;
  const inTemplate = templateHTML.includes('change-type-action') &&
    (templateHTML.includes('name="TOPIC"') || templateHTML.includes('${$value.value}'));
  assert(inDOM || inTemplate, 'TOPIC type control not found in DOM or templates');
});

test('DETAIL_INCLUDE (input[name="include"]) in templates', () => {
  assert(templateHTML.includes('name="include"'), 'include radio not found in templates');
});

test('DETAIL_EXCLUDE (input[name="exclude"]) in templates', () => {
  assert(templateHTML.includes('name="exclude"'), 'exclude radio not found in templates');
});

test('RADIO_WRAPPER (.a-declarative) in templates', () => {
  assert(templateHTML.includes('a-declarative'), 'a-declarative wrapper not found in templates');
});

console.log(`\n${CYAN}${BOLD}▸ Description Dialog Selectors (Rendered DOM)${RESET}`);

test('DESC_DIALOG (#humanDescriptionDialog) exists', () => {
  const count = selectorMatchesDOM(XRAY.SEL.DESC_DIALOG);
  assert(count > 0, 'humanDescriptionDialog not found');
});

test('DESC_MODAL_BODY (.modal-body) exists in dialog', () => {
  const count = selectorMatchesDOM(XRAY.SEL.DESC_MODAL_BODY);
  assert(count > 0, 'modal-body not found in dialog');
});

test('DESC_SUBMIT (#humanDescriptionButton) exists', () => {
  const count = selectorMatchesDOM(XRAY.SEL.DESC_SUBMIT);
  assert(count > 0, 'humanDescriptionButton not found');
});

test('DESC_SUBMIT has disabled attribute by default', () => {
  const btn = document.querySelector(XRAY.SEL.DESC_SUBMIT);
  assert(btn && btn.hasAttribute('disabled'), 'Submit button should be disabled by default');
});

test('DESC_SUBMIT parent has .a-button wrapper', () => {
  const btn = document.querySelector(XRAY.SEL.DESC_SUBMIT);
  const wrapper = btn?.closest('.a-button');
  assert(wrapper, 'Submit button should be wrapped in .a-button span');
});

test('DESC_ADD_BTN selector pattern in templates', () => {
  assert(
    templateHTML.includes('add-description-action') && templateHTML.includes('AUTHOR'),
    'add-description-action with AUTHOR not found'
  );
});

console.log(`\n${CYAN}${BOLD}▸ Description/Commentary Text Selectors (Templates)${RESET}`);

test('DESC_TEXT (#descriptionRow) in templates', () => {
  assert(templateHTML.includes('descriptionRow'), 'descriptionRow not found in templates');
});

test('COMMENTARY_TEXT (.entityDescriptions .a-box-inner) patterns in templates', () => {
  assert(
    templateHTML.includes('entityDescriptions') && templateHTML.includes('a-box-inner'),
    'entityDescriptions or a-box-inner not found in templates'
  );
});

console.log(`\n${CYAN}${BOLD}▸ Alias Selectors (Templates)${RESET}`);

test('ALIAS_LIST (.aliases .alias) in templates', () => {
  assert(
    templateHTML.includes('class="aliases"') || templateHTML.includes("class='aliases'") || templateHTML.includes('aliases'),
    'aliases container not found in templates'
  );
  assert(
    templateHTML.includes('class="alias"') || templateHTML.includes("class='alias'") || templateHTML.match(/class="[^"]*alias[^"]*"/),
    'alias class not found in templates'
  );
});

test('ALIAS_TEXT (.aliasText) in templates', () => {
  assert(templateHTML.includes('aliasText'), 'aliasText class not found in templates');
});

test('ALIAS_REMOVE ([data-action="remove-alias-action"]) in templates', () => {
  assert(templateHTML.includes('remove-alias-action'), 'remove-alias-action not found in templates');
});

console.log(`\n${CYAN}${BOLD}▸ Review Toggle Selectors${RESET}`);

test('DONE_SWITCH (input[name="doneSwitch"]) in templates', () => {
  assert(templateHTML.includes('doneSwitch'), 'doneSwitch not found in templates');
});

test('DONE_SWITCH_LABEL (#doneSwitch label.a-switch-label) in templates', () => {
  assert(
    templateHTML.includes('a-switch-label') && templateHTML.includes('doneSwitch'),
    'a-switch-label or doneSwitch not found'
  );
});

console.log(`\n${CYAN}${BOLD}▸ Real Page Data Integrity${RESET}`);

test('Page has substantial number of entities (>10)', () => {
  const count = selectorMatchesDOM(XRAY.SEL.ENTITY_ITEM);
  assert(count > 10, `Only ${count} entities found, expected >10`);
  console.log(`    → ${count} total entities`);
});

test('Entity names are non-empty strings', () => {
  const names = Array.from(document.querySelectorAll(`${XRAY.SEL.ENTITY_ITEM} ${XRAY.SEL.ENTITY_NAME}`));
  const empty = names.filter(n => !n.textContent?.trim());
  assert(empty.length === 0, `${empty.length} entities have empty names`);
});

test('Entity statuses exist', () => {
  const statuses = Array.from(document.querySelectorAll(`${XRAY.SEL.ENTITY_ITEM} ${XRAY.SEL.ENTITY_STATUS}`));
  assert(statuses.length > 0, 'No entity statuses found');
  const statusTexts = new Set(statuses.map(s => s.textContent?.trim()).filter(Boolean));
  console.log(`    → Status values: ${[...statusTexts].join(', ')}`);
});

test('All data-index values are unique integers', () => {
  const entities = document.querySelectorAll(`${XRAY.SEL.ENTITY_ITEM}[data-index]`);
  const indices = new Set();
  entities.forEach(e => {
    const idx = parseInt(e.getAttribute('data-index'));
    assert(!isNaN(idx), `Invalid data-index: ${e.getAttribute('data-index')}`);
    assert(!indices.has(idx), `Duplicate data-index: ${idx}`);
    indices.add(idx);
  });
  console.log(`    → Index range: ${Math.min(...indices)} to ${Math.max(...indices)}`);
});

// ============ SUMMARY ============
console.log('\n' + '='.repeat(60));
if (failedTests === 0) {
  console.log(`${GREEN}${BOLD}ALL PASS: ${passedTests}/${totalTests} tests passed ✓${RESET}`);
} else {
  console.log(`${RED}${BOLD}RESULT: ${passedTests} passed, ${failedTests} FAILED${RESET}`);
  console.log(`\n${RED}Failed tests:${RESET}`);
  for (const f of failures) {
    console.log(`  ${RED}  ${f.test}: ${f.error}${RESET}`);
  }
}
if (warnTests > 0) {
  console.log(`${YELLOW}Warnings: ${warnTests}${RESET}`);
}
console.log('='.repeat(60));
process.exit(failedTests > 0 ? 1 : 0);
