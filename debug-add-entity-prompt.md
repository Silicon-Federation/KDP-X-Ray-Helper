# Debug Prompt for Claude in Chrome

Paste the following into Claude in Chrome while a KDP X-Ray Verify page is open.

---

I'm debugging a Chrome extension that creates new entities via the KDP X-Ray "Add a new item" dialog. The create operation is failing and I need you to inspect the real page DOM.

Run the following debug steps on the current KDP X-Ray page and report each result.

## Step 1: Check the "Add a new item" button

```javascript
// Check if button exists
const btn1 = document.querySelector('#newEntityButton a');
const btn2 = document.querySelector('#newEntityButton');
console.log('btn via #newEntityButton a:', btn1?.tagName, btn1?.textContent?.trim());
console.log('btn via #newEntityButton:', btn2?.tagName, btn2?.textContent?.trim());
// Full HTML of #newEntityButton
console.log('HTML:', btn2?.outerHTML?.substring(0, 500));
```

Run the above code and report the output.

## Step 2: Click the button to open the dialog

```javascript
// Try clicking the button
const btn = document.querySelector('#newEntityButton a') || document.querySelector('#newEntityButton');
if (btn) btn.click();
```

After running, did a dialog appear? Take a screenshot.

## Step 3: Inspect dialog DOM structure

After the dialog opens, run:

```javascript
const dialog = document.querySelector('#newEntityDialog');
console.log('Dialog found:', !!dialog);
console.log('Dialog classes:', dialog?.className);
console.log('Dialog display:', dialog?.style?.display);
console.log('Dialog visible:', dialog?.classList?.contains('in'));

// Check name input
const nameInput = document.querySelector('#entityName');
console.log('Name input:', nameInput?.tagName, nameInput?.type);

// Check entity type buttons — this is the key part!
const typeContainer = document.querySelector('#entityType');
console.log('Type container HTML:', typeContainer?.innerHTML?.substring(0, 800));

// Try various possible type button selectors
const selectors = [
  '#entityType [data-value="CHARACTER"]',
  '#entityType button[name="CHARACTER"]',
  '#entityType .a-button-text',
  '#entityType .a-button',
  '#entityType label',
  '#entityType input[type="radio"]',
];
selectors.forEach(sel => {
  const el = document.querySelector(sel);
  console.log(`Selector "${sel}":`, el ? `FOUND (${el.tagName} ${el.textContent?.trim()?.substring(0,30)})` : 'NOT FOUND');
});

// Check submit button
const submitSelectors = [
  '#createNewEntityButton input',
  '#createNewEntityButton .a-button-input',
  '#createNewEntityButton button',
  '#createNewEntityButton',
];
submitSelectors.forEach(sel => {
  const el = document.querySelector(sel);
  console.log(`Submit "${sel}":`, el ? `FOUND (${el.tagName} disabled=${el.disabled})` : 'NOT FOUND');
});
```

Run and report all output.

## Step 4: Try manually creating an entity

```javascript
// 1. Fill in name
const nameInput = document.querySelector('#entityName');
nameInput.value = 'TEST_DEBUG_ENTITY';
nameInput.dispatchEvent(new Event('input', { bubbles: true }));
nameInput.dispatchEvent(new Event('change', { bubbles: true }));
nameInput.dispatchEvent(new Event('keyup', { bubbles: true }));

// 2. Wait 1s then check submit button state
setTimeout(() => {
  const submitBtn = document.querySelector('#createNewEntityButton input') ||
                    document.querySelector('#createNewEntityButton .a-button-input');
  const outer = document.querySelector('#createNewEntityButton');
  console.log('After name input - submit disabled:', submitBtn?.disabled);
  console.log('After name input - outer classes:', outer?.className);

  // 3. Force-enable and click submit
  if (submitBtn) {
    submitBtn.removeAttribute('disabled');
    if (outer) outer.classList.remove('a-button-disabled');
    submitBtn.click();
    console.log('Submit clicked!');
  }

  // 4. Wait 3s then check sidebar for new entity
  setTimeout(() => {
    const entities = document.querySelectorAll('.entity.well');
    const names = Array.from(entities).map(e => e.querySelector('.displayname')?.textContent?.trim());
    console.log('Total entities after create:', names.length);
    console.log('Has TEST_DEBUG_ENTITY:', names.includes('TEST_DEBUG_ENTITY'));
    console.log('Last 3 names:', names.slice(-3));
  }, 3000);
}, 1000);
```

After running, report:
1. Did the submit button's disabled state change after entering the name?
2. Did "TEST_DEBUG_ENTITY" appear in the sidebar after clicking submit?
3. If not, were there any error messages or visual changes?

## Step 5: Check network requests

If the entity did not appear in Step 4, check the browser DevTools Network tab:
- Was an XHR/Fetch request sent after clicking submit?
- What was the request URL?
- What was the response status code?
- What was the response body?

## Final Output

Compile all results into a report like this:

```
=== KDP Add Entity Debug Report ===

1. Add button: [found/not found] [selector]
2. Dialog opens: [yes/no] [selector used]
3. Name input: [found/not found]
4. Type buttons: [which selector works]
5. Submit button: [selector] [initial disabled state]
6. After name input: [does submit auto-enable?]
7. After submit click: [entity created successfully?]
8. Network request: [URL] [status code] [response]
9. Full #entityType container HTML
10. Full #createNewEntityButton HTML
```

This information will help fix the extension's addNewEntity feature. If you created the test entity TEST_DEBUG_ENTITY, remember to delete it.
