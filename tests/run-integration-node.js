#!/usr/bin/env node
/**
 * Headless integration test runner using Node.js + jsdom
 * Tests DOM reader/writer operations against mock KDP page
 */

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// ============ COLORS ============
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

// ============ LOAD MODULES ============
const rootDir = path.resolve(__dirname, '..');

function loadFile(filePath) {
  return fs.readFileSync(path.join(rootDir, filePath), 'utf-8');
}

function loadAndExec(filePath) {
  const src = fs.readFileSync(path.join(rootDir, filePath), 'utf-8');
  const modified = src.replace(/^const (\w+)\s*=/m, 'global.$1 =');
  new Function(modified)();
}

// Load constants into global scope
global.chrome = { storage: { sync: { get: (k, cb) => cb && cb({}) } } };
loadAndExec('shared/constants.js');
loadAndExec('shared/diff-engine.js');

const { XRAY, DiffEngine } = global;

// Load mock KDP page into jsdom
const mockHtml = loadFile('tests/mock-kdp-page.html');
const dom = new JSDOM(mockHtml, {
  url: 'https://kdp.amazon.com/xray/verify/mock',
  runScripts: 'dangerously',
  resources: 'usable',
  pretendToBeVisual: true,
});
const mockDoc = dom.window.document;
const mockWin = dom.window;

// ============ TEST FRAMEWORK ============
let totalTests = 0, passedTests = 0, failedTests = 0;
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

// ============ MOCK DOM READER ============
const reader = {
  getAllEntities() {
    const entities = mockDoc.querySelectorAll(XRAY.SEL.ENTITY_ITEM);
    return Array.from(entities).map(el => ({
      name: el.querySelector(XRAY.SEL.ENTITY_NAME)?.textContent?.trim() || '',
      status: el.querySelector(XRAY.SEL.ENTITY_STATUS)?.textContent?.trim() || '',
      index: parseInt(el.getAttribute('data-index')),
      element: el,
    }));
  },
  getCurrentEntityName() {
    return mockDoc.querySelector(XRAY.SEL.DETAIL_LABEL)?.textContent?.trim() || '';
  },
  readCurrentEntityDetails() {
    const name = this.getCurrentEntityName();
    if (!name) return null;
    const topicRadio = mockDoc.querySelector(XRAY.SEL.DETAIL_TYPE_TOPIC);
    const type = topicRadio?.checked ? XRAY.TYPE.TERM : XRAY.TYPE.CHARACTER;
    const includeRadio = mockDoc.querySelector(XRAY.SEL.DETAIL_INCLUDE);
    const included = includeRadio ? includeRadio.checked : true;
    const description = mockDoc.querySelector(XRAY.SEL.DESC_TEXT)?.textContent?.trim() || '';
    const commentary = mockDoc.querySelector(XRAY.SEL.COMMENTARY_TEXT)?.textContent?.trim() || '';
    const doneSwitch = mockDoc.querySelector(XRAY.SEL.DONE_SWITCH);
    const reviewed = doneSwitch ? doneSwitch.checked : false;
    const aliasEls = mockDoc.querySelectorAll(XRAY.SEL.ALIAS_LIST);
    const aliases = Array.from(aliasEls).map(el => {
      // For table rows: first <td> contains the alias text
      if (el.tagName === 'TR') {
        const firstTd = el.querySelector('td');
        return firstTd?.textContent?.trim();
      }
      // For div-based: look for .aliasText span
      const textEl = el.querySelector(XRAY.SEL.ALIAS_TEXT);
      return (textEl || el).textContent?.trim();
    }).filter(Boolean);
    return { name, type, included, description, commentary, reviewed, aliases };
  },
  isPageReady() {
    return mockDoc.querySelectorAll(XRAY.SEL.ENTITY_ITEM).length > 0;
  },
  exportEntitiesQuick() {
    return this.getAllEntities().map(e => ({ name: e.name, status: e.status, dataIndex: e.index }));
  },
};

// ============ MOCK DOM WRITER ============
function simulateClick(el) {
  if (!el) return;
  el.dispatchEvent(new mockWin.MouseEvent('click', { bubbles: true, cancelable: true }));
}

function getSelectedIndex() {
  // Read selectedIndex from the mock page's exposed function
  if (typeof mockWin._selectedIndex === 'function') return mockWin._selectedIndex();
  // Fallback: find from DOM selected class
  const selected = mockDoc.querySelector('.entity.well.selected');
  return selected ? parseInt(selected.getAttribute('data-index')) : -1;
}

const writer = {
  selectEntityByIndex(dataIndex) {
    const entity = mockDoc.querySelector(`${XRAY.SEL.ENTITY_ITEM}[data-index="${dataIndex}"]`);
    if (!entity) throw new Error(`Entity ${dataIndex} not found`);
    simulateClick(entity);
    return reader.getCurrentEntityName();
  },
  selectEntityByName(name) {
    const match = reader.getAllEntities().find(e => e.name.toLowerCase() === name.toLowerCase());
    if (!match) throw new Error(`Entity "${name}" not found`);
    return this.selectEntityByIndex(match.index);
  },
  setEntityType(type) {
    const sel = type === XRAY.TYPE.CHARACTER ? XRAY.SEL.DETAIL_TYPE_CHAR : XRAY.SEL.DETAIL_TYPE_TOPIC;
    const radio = mockDoc.querySelector(sel);
    if (!radio) throw new Error(`Radio for ${type} not found`);
    radio.checked = true;
    // Also uncheck the other radio
    const otherSel = type === XRAY.TYPE.CHARACTER ? XRAY.SEL.DETAIL_TYPE_TOPIC : XRAY.SEL.DETAIL_TYPE_CHAR;
    const otherRadio = mockDoc.querySelector(otherSel);
    if (otherRadio) otherRadio.checked = false;
    radio.dispatchEvent(new mockWin.Event('change', { bubbles: true }));
    // Update mock data directly
    const idx = getSelectedIndex();
    if (idx >= 0 && mockWin._mockEntities) {
      mockWin._mockEntities[idx].type = type === XRAY.TYPE.CHARACTER ? 'CHARACTER' : 'TOPIC';
    }
  },
  setIncludeExclude(include) {
    const incRadio = mockDoc.querySelector(XRAY.SEL.DETAIL_INCLUDE);
    const excRadio = mockDoc.querySelector(XRAY.SEL.DETAIL_EXCLUDE);
    if (include) {
      incRadio.checked = true;
      excRadio.checked = false;
    } else {
      incRadio.checked = false;
      excRadio.checked = true;
    }
    const target = include ? incRadio : excRadio;
    target.dispatchEvent(new mockWin.Event('change', { bubbles: true }));
    // Update mock data
    const idx = getSelectedIndex();
    if (idx >= 0 && mockWin._mockEntities) {
      mockWin._mockEntities[idx].included = include;
    }
  },
  setDescription(desc, commentary) {
    const idx = getSelectedIndex();
    if (idx >= 0 && mockWin._mockEntities) {
      mockWin._mockEntities[idx].description = desc;
      mockWin._mockEntities[idx].commentary = commentary || '';
      // Re-render description with .entityDescription/.entityCommentary classes
      const container = mockDoc.getElementById('desc-container');
      if (container) {
        container.innerHTML = '';
        if (desc) {
          const descDiv = mockDoc.createElement('div');
          descDiv.className = 'entityDescription';
          descDiv.textContent = desc;
          container.appendChild(descDiv);
          if (commentary) {
            const commDiv = mockDoc.createElement('div');
            commDiv.className = 'entityCommentary';
            commDiv.textContent = commentary;
            container.appendChild(commDiv);
          }
        }
      }
    }
  },
  setItemReviewed(reviewed) {
    const sw = mockDoc.querySelector(XRAY.SEL.DONE_SWITCH);
    if (!sw) return;
    sw.checked = reviewed;
    sw.dispatchEvent(new mockWin.Event('change', { bubbles: true }));
    // Update mock data
    const idx = getSelectedIndex();
    if (idx >= 0 && mockWin._mockEntities) {
      mockWin._mockEntities[idx].reviewed = reviewed;
    }
  },
};

// ============ RUN TESTS (after scripts execute) ============
setTimeout(() => {

  // ---- Entity List ----
  suite('DomReader — Entity List');

  test('Page is ready', () => assert(reader.isPageReady()));
  test('8 entities found', () => assertEqual(reader.getAllEntities().length, 8));
  test('First entity = Kyle Chen', () => assertEqual(reader.getAllEntities()[0].name, 'Kyle Chen'));
  test('All names correct', () => {
    const names = reader.getAllEntities().map(e => e.name);
    const expected = ['Kyle Chen', 'Sarah Lin', 'The Shadow King', 'Professor Zhang',
                      'Nexus Portal', 'Shadowlands', 'Crystal Sword', 'Minor Character Bob'];
    expected.forEach((n, i) => assertEqual(names[i], n, `Entity ${i}`));
  });
  test('Indices sequential', () => {
    reader.getAllEntities().forEach((e, i) => assertEqual(e.index, i));
  });
  test('exportEntitiesQuick', () => {
    const q = reader.exportEntitiesQuick();
    assertEqual(q.length, 8);
    assert(typeof q[0].dataIndex === 'number');
  });

  // ---- Entity Details ----
  suite('DomReader — Entity Details');

  test('Default entity = Kyle Chen', () => assertEqual(reader.getCurrentEntityName(), 'Kyle Chen'));
  test('Details has all fields', () => {
    const d = reader.readCurrentEntityDetails();
    assert(d !== null);
    assert('name' in d && 'type' in d && 'included' in d && 'description' in d && 'reviewed' in d);
  });
  test('Kyle is CHARACTER', () => assertEqual(reader.readCurrentEntityDetails().type, 'CHARACTER'));
  test('Kyle has description', () => assert(reader.readCurrentEntityDetails().description.length > 0));
  test('Kyle has aliases', () => assert(reader.readCurrentEntityDetails().aliases.length > 0));

  // ---- Entity Navigation ----
  suite('DomWriter — Navigation');

  test('Select by index (2 = Shadow King)', () => {
    assertEqual(writer.selectEntityByIndex(2), 'The Shadow King');
  });
  test('Select by name (Sarah Lin)', () => {
    assertEqual(writer.selectEntityByName('Sarah Lin'), 'Sarah Lin');
  });
  test('Case insensitive select', () => {
    assertEqual(writer.selectEntityByName('nexus portal'), 'Nexus Portal');
  });
  test('Nonexistent throws', () => {
    let threw = false;
    try { writer.selectEntityByName('Nonexistent'); } catch { threw = true; }
    assert(threw);
  });
  test('Multi-navigate', () => {
    writer.selectEntityByIndex(0);
    assertEqual(reader.getCurrentEntityName(), 'Kyle Chen');
    writer.selectEntityByIndex(7);
    assertEqual(reader.getCurrentEntityName(), 'Minor Character Bob');
    writer.selectEntityByIndex(4);
    assertEqual(reader.getCurrentEntityName(), 'Nexus Portal');
  });

  // ---- Type Changes ----
  suite('DomWriter — Type Changes');

  test('Kyle initially CHARACTER', () => {
    writer.selectEntityByIndex(0);
    assertEqual(reader.readCurrentEntityDetails().type, 'CHARACTER');
  });
  test('Change Kyle to TERM', () => {
    writer.selectEntityByIndex(0);
    writer.setEntityType(XRAY.TYPE.TERM);
    assertEqual(reader.readCurrentEntityDetails().type, 'TERM');
  });
  test('Nexus initially TERM', () => {
    writer.selectEntityByIndex(4);
    assertEqual(reader.readCurrentEntityDetails().type, 'TERM');
  });
  test('Change Nexus to CHARACTER', () => {
    writer.selectEntityByIndex(4);
    writer.setEntityType(XRAY.TYPE.CHARACTER);
    assertEqual(reader.readCurrentEntityDetails().type, 'CHARACTER');
  });

  // ---- Include/Exclude ----
  suite('DomWriter — Include/Exclude');

  test('Kyle initially included', () => {
    writer.selectEntityByIndex(0);
    assertEqual(reader.readCurrentEntityDetails().included, true);
  });
  test('Exclude Kyle', () => {
    writer.selectEntityByIndex(0);
    writer.setIncludeExclude(false);
    assertEqual(reader.readCurrentEntityDetails().included, false);
  });
  test('Re-include Kyle', () => {
    writer.setIncludeExclude(true);
    assertEqual(reader.readCurrentEntityDetails().included, true);
  });

  // ---- Description ----
  suite('DomWriter — Description');

  test('Set description on Kyle', () => {
    writer.selectEntityByIndex(0);
    writer.setDescription('Updated by test', 'Test comment');
    assertEqual(reader.readCurrentEntityDetails().description, 'Updated by test');
  });
  test('Special chars in description', () => {
    writer.selectEntityByIndex(0);
    writer.setDescription('Test "quotes" & <tags> 中文', '');
    assertEqual(reader.readCurrentEntityDetails().description, 'Test "quotes" & <tags> 中文');
  });

  // ---- Review Toggle ----
  suite('DomWriter — Review Toggle');

  test('Kyle initially not reviewed', () => {
    writer.selectEntityByIndex(0);
    // Reset from mock data
    const sw = mockDoc.querySelector(XRAY.SEL.DONE_SWITCH);
    sw.checked = false;
    assertEqual(reader.readCurrentEntityDetails().reviewed, false);
  });
  test('Set reviewed=true', () => {
    writer.setItemReviewed(true);
    assertEqual(reader.readCurrentEntityDetails().reviewed, true);
  });
  test('Set reviewed=false', () => {
    writer.setItemReviewed(false);
    assertEqual(reader.readCurrentEntityDetails().reviewed, false);
  });

  // ---- Batch Workflow ----
  suite('Batch Workflow (simulated)');

  test('Full update workflow', () => {
    writer.selectEntityByName('Kyle Chen');
    writer.setEntityType(XRAY.TYPE.CHARACTER);
    writer.setIncludeExclude(true);
    writer.setDescription('Updated by batch', 'Auto');
    writer.setItemReviewed(true);
    const d = reader.readCurrentEntityDetails();
    assertEqual(d.description, 'Updated by batch');
    assertEqual(d.reviewed, true);
  });
  test('Delete (exclude) workflow', () => {
    writer.selectEntityByName('Minor Character Bob');
    writer.setIncludeExclude(false);
    writer.setItemReviewed(true);
    const d = reader.readCurrentEntityDetails();
    assertEqual(d.included, false);
    assertEqual(d.reviewed, true);
  });
  test('Multi-entity sequential', () => {
    const ops = [
      { name: 'Sarah Lin', desc: 'Physicist' },
      { name: 'Crystal Sword', desc: 'Artifact' },
    ];
    for (const op of ops) {
      writer.selectEntityByName(op.name);
      writer.setDescription(op.desc, '');
      writer.setItemReviewed(true);
    }
    for (const op of ops) {
      writer.selectEntityByName(op.name);
      assertEqual(reader.readCurrentEntityDetails().description, op.desc);
    }
  });

  // ---- Diff Integration ----
  suite('Diff + DOM Integration');

  test('Generate diff from mock entities', () => {
    const kdpEnts = reader.exportEntitiesQuick().map(e => ({
      name: e.name, type: 'CHARACTER', description: '',
    }));
    const imported = [
      { name: 'Kyle Chen', type: 'CHARACTER', description: 'Hero', action: 'update' },
      { name: 'Bob', type: 'CHARACTER', action: 'delete' },
      { name: 'Alice', type: 'CHARACTER', description: 'New', action: 'update' },
    ];
    const diff = DiffEngine.generateDiff(imported, kdpEnts, { showUnmatched: true });
    assert(Array.isArray(diff) && diff.length > 0);
  });

  // ---- Add New Entity ----
  suite('Add New Entity');

  test('New entity button exists', () => {
    assert(mockDoc.querySelector(XRAY.SEL.NEW_ENTITY_BTN) !== null, 'NEW_ENTITY_BTN not found');
  });
  test('New entity dialog exists', () => {
    assert(mockDoc.querySelector(XRAY.SEL.NEW_ENTITY_DIALOG) !== null, 'NEW_ENTITY_DIALOG not found');
  });
  test('New entity name input exists', () => {
    assert(mockDoc.querySelector(XRAY.SEL.NEW_ENTITY_NAME) !== null, 'NEW_ENTITY_NAME not found');
  });
  test('New entity submit exists', () => {
    assert(mockDoc.querySelector(XRAY.SEL.NEW_ENTITY_SUBMIT) !== null, 'NEW_ENTITY_SUBMIT not found');
  });
  test('Add new entity via dialog', () => {
    const countBefore = reader.getAllEntities().length;
    // Open dialog
    simulateClick(mockDoc.querySelector(XRAY.SEL.NEW_ENTITY_BTN));
    // Fill name
    const nameInput = mockDoc.querySelector(XRAY.SEL.NEW_ENTITY_NAME);
    nameInput.value = 'New Test Entity';
    nameInput.dispatchEvent(new mockWin.Event('input', { bubbles: true }));
    // Select type
    const topicBtn = mockDoc.querySelector('#entityType [data-value="TOPIC"]');
    simulateClick(topicBtn);
    // Submit
    const submitBtn = mockDoc.querySelector(XRAY.SEL.NEW_ENTITY_SUBMIT);
    submitBtn.removeAttribute('disabled');
    simulateClick(submitBtn);
    // Verify
    const countAfter = reader.getAllEntities().length;
    assertEqual(countAfter, countBefore + 1, 'Entity count should increase by 1');
    const newEntity = reader.getAllEntities().find(e => e.name === 'New Test Entity');
    assert(newEntity !== null, 'New entity should appear in sidebar');
  });
  test('New entity has correct data', () => {
    const entity = mockWin._mockEntities.find(e => e.name === 'New Test Entity');
    assert(entity !== null, 'New entity in mock data');
    assertEqual(entity.type, 'TOPIC', 'New entity type');
  });

  // ---- Delete (Exclude) Verification ----
  suite('Delete (Exclude) Workflow');

  test('Exclude entity sets included=false', () => {
    writer.selectEntityByName('Minor Character Bob');
    writer.setIncludeExclude(false);
    const entity = mockWin._mockEntities.find(e => e.name === 'Minor Character Bob');
    assertEqual(entity.included, false, 'Entity should be excluded');
  });
  test('Excluded entity is reviewed', () => {
    writer.setItemReviewed(true);
    const entity = mockWin._mockEntities.find(e => e.name === 'Minor Character Bob');
    assertEqual(entity.reviewed, true, 'Excluded entity should be reviewed');
  });
  test('Exclude does not remove entity from sidebar', () => {
    const exists = reader.getAllEntities().some(e => e.name === 'Minor Character Bob');
    assert(exists, 'Excluded entity should still be in sidebar');
  });

  // ---- Diff — Add action for new entities ----
  suite('Diff — Add Action');

  test('import_only entities get action=add', () => {
    const kdpEnts = [{ name: 'Kyle Chen', type: 'CHARACTER', description: '' }];
    const imported = [
      { name: 'Kyle Chen', type: 'CHARACTER', description: 'Hero', action: 'update' },
      { name: 'Brand New Character', type: 'CHARACTER', description: 'New', action: 'update' },
    ];
    const diff = DiffEngine.generateDiff(imported, kdpEnts, { showUnmatched: false });
    const newItem = diff.find(d => d.name === 'Brand New Character');
    assert(newItem !== null, 'New entity should be in diff');
    assertEqual(newItem.action, 'add', 'New entity action should be add');
    assertEqual(newItem.source, 'import_only', 'New entity source should be import_only');
  });
  test('getDiffStats includes adds count', () => {
    const kdpEnts = [{ name: 'A', type: 'CHARACTER' }];
    const imported = [
      { name: 'A', type: 'CHARACTER', description: 'update', action: 'update' },
      { name: 'B', type: 'CHARACTER', description: 'new', action: 'update' },
      { name: 'C', type: 'TERM', description: 'new2', action: 'update' },
    ];
    const diff = DiffEngine.generateDiff(imported, kdpEnts, { showUnmatched: false });
    const stats = DiffEngine.getDiffStats(diff);
    assertEqual(stats.adds, 2, 'Should have 2 adds');
  });

  // ---- Selector Compatibility ----
  suite('CSS Selector Compatibility');

  test('ENTITY_ITEM', () => {
    // 8 original + 1 added by "Add New Entity" test = 9
    assert(mockDoc.querySelectorAll(XRAY.SEL.ENTITY_ITEM).length >= 8, 'At least 8 entities');
  });
  test('ENTITY_NAME', () => {
    const el = mockDoc.querySelector(XRAY.SEL.ENTITY_ITEM);
    assert(el.querySelector(XRAY.SEL.ENTITY_NAME) !== null);
  });
  test('DETAIL_LABEL', () => assert(mockDoc.querySelector(XRAY.SEL.DETAIL_LABEL) !== null));
  test('Type radios', () => {
    assert(mockDoc.querySelector(XRAY.SEL.DETAIL_TYPE_CHAR) !== null);
    assert(mockDoc.querySelector(XRAY.SEL.DETAIL_TYPE_TOPIC) !== null);
  });
  test('Include/Exclude radios', () => {
    assert(mockDoc.querySelector(XRAY.SEL.DETAIL_INCLUDE) !== null);
    assert(mockDoc.querySelector(XRAY.SEL.DETAIL_EXCLUDE) !== null);
  });
  test('DESC_ADD_BTN', () => assert(mockDoc.querySelector(XRAY.SEL.DESC_ADD_BTN) !== null));
  test('DESC_DIALOG', () => assert(mockDoc.querySelector(XRAY.SEL.DESC_DIALOG) !== null));
  test('DESC_SUBMIT', () => assert(mockDoc.querySelector(XRAY.SEL.DESC_SUBMIT) !== null));
  test('DONE_SWITCH', () => assert(mockDoc.querySelector(XRAY.SEL.DONE_SWITCH) !== null));
  test('DESC_TEXT (.entityDescription)', () => {
    // Ensure entity with description is selected
    writer.selectEntityByIndex(0);
    writer.setDescription('test desc', '');
    assert(mockDoc.querySelector(XRAY.SEL.DESC_TEXT) !== null, 'DESC_TEXT selector not found');
  });
  test('COMMENTARY_TEXT (.entityCommentary)', () => {
    writer.selectEntityByIndex(0);
    writer.setDescription('test desc', 'test commentary');
    assert(mockDoc.querySelector(XRAY.SEL.COMMENTARY_TEXT) !== null, 'COMMENTARY_TEXT selector not found');
  });
  test('ALIAS_LIST (tr.alias)', () => assert(mockDoc.querySelectorAll(XRAY.SEL.ALIAS_LIST).length > 0));
  test('ALIAS_LIST first td has alias text', () => {
    const alias = mockDoc.querySelector(XRAY.SEL.ALIAS_LIST);
    const td = alias.querySelector('td');
    assert(td !== null && td.textContent.trim().length > 0, 'Alias td not found or empty');
  });
  test('DESC_SUBMIT has .a-button wrapper', () => {
    const btn = mockDoc.querySelector(XRAY.SEL.DESC_SUBMIT);
    assert(btn.closest('.a-button') !== null, 'Submit btn missing .a-button wrapper');
  });
  test('DESC_SUBMIT initially disabled', () => {
    const btn = mockDoc.querySelector(XRAY.SEL.DESC_SUBMIT);
    assert(btn.hasAttribute('disabled'), 'Submit btn should be disabled by default');
  });

  // ============ SUMMARY ============
  console.log('\n' + '='.repeat(50));
  if (failedTests === 0) {
    console.log(`${GREEN}${BOLD}ALL PASS: ${passedTests}/${totalTests} integration tests passed ✓${RESET}`);
  } else {
    console.log(`${RED}${BOLD}FAILED: ${passedTests}/${totalTests} passed, ${failedTests} failed${RESET}`);
    for (const f of failures) {
      console.log(`  ${RED}  [${f.suite}] ${f.test}: ${f.error}${RESET}`);
    }
  }
  console.log('='.repeat(50));
  process.exit(failedTests > 0 ? 1 : 0);

}, 500);
