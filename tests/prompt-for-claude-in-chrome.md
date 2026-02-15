# Prompt: Analyze KDP X-Ray Page and Generate Local Mock HTML

> Paste the following prompt into Claude in Chrome while a real KDP X-Ray Verify page is open.

---

## Prompt

Please carefully analyze the currently open KDP X-Ray Verify page (URL like `https://kdp.amazon.com/xray/verify/...`). I need you to generate a **high-fidelity local mock HTML file** for offline Chrome extension development and testing.

### What you need to do

**Step 1: Extract page structure**

Inspect and record the **exact HTML structure, CSS classes, IDs, data attributes, and nesting hierarchy** for each of the following DOM elements:

1. **Sidebar entity list area**:
   - Entity item container (focus on `.entity.well` selector and `data-index` attribute)
   - Entity name element (focus on `.displayname` selector)
   - Entity status element (focus on `.entity-status` selector)
   - List outer container, search/filter controls (if any)
   - How entity count is displayed
   - Selected state class names and visual effects

2. **Right-side entity detail panel**:
   - Outer container (focus on `.entityAttributes` selector)
   - Entity name label (focus on `.entityAttributes .entityLabel` selector)
   - **Type selector** (focus on `input[name="CHARACTER"]` and `input[name="TOPIC"]` radio buttons, including outer `.a-declarative` wrapper)
   - **Include/exclude** (focus on `input[name="include"]` and `input[name="exclude"]`)
   - **Description text area** (focus on `.entityDescription` selector)
   - **Commentary text area** (focus on `.entityCommentary` selector)
   - **Alias list** (focus on `tr.alias` selector, and each alias's delete button `[data-action="remove-alias-action"]` with its `data-remove-alias-action` JSON attribute)
   - **"Add/Edit description" button** (focus on `[data-action="add-description-action"]` containing `"AUTHOR"` in its `data-add-description-action` attribute)
   - **Review status toggle** (focus on `input[name="doneSwitch"]` checkbox and `#doneSwitch label.a-switch-label`)

3. **Description edit dialog/modal**:
   - Modal container (focus on `#humanDescriptionDialog`)
   - Class changes when dialog opens (does it add `.in` class, or change `style="display: block"`?)
   - `.modal-body` textarea elements (description and commentary inputs)
   - Submit button (focus on `#humanDescriptionButton` or `.a-button-input` / `input[type="submit"]`)
   - Close/cancel button

4. **Page header/navigation area**:
   - Book title and ASIN display
   - X-Ray status bar (if any)
   - Breadcrumb navigation

5. **Amazon common UI framework**:
   - CSS framework class name prefixes (Amazon's own UI framework classes, e.g. `a-` prefix)
   - Button style classes
   - Form control styles

**Step 2: Extract real data**

List the following information for **all entities** on the current page:
- Name
- Type (CHARACTER or TOPIC/TERM)
- Status (Needs Review / Approved etc.)
- Description — click through several entities to read details if needed
- Commentary
- Alias list
- Reviewed state
- Included state

**Step 3: Record interaction behavior**

Observe and record:
- What happens when clicking a sidebar entity — how does the detail panel update (AJAX async load or client-side render)?
- Radio button click behavior — click the radio itself, or the outer `.a-declarative` wrapper?
- Description dialog open/close animation and class toggle mechanism
- `doneSwitch` checkbox change effects — does it sync-update the sidebar status text?
- Are any AJAX requests sent when fields change (check Network tab)?

**Step 4: Generate Mock HTML file**

Based on the above analysis, generate a **complete, self-contained** single HTML file (`mock-kdp-page.html`):

#### Structure requirements
- **DOM structure must exactly match the real page** — class names, IDs, data attributes, nesting hierarchy
- Sidebar and detail panel use the same layout method as the real page (flex/grid/table etc.)
- Include a simplified page header/nav to make it look like the real KDP environment

#### CSS requirements
- Copy key CSS rules from the real page (colors, font sizes, spacing, borders)
- Amazon-specific UI element styles (orange buttons, `a-` prefix component styles)
- Modal overlay and animation effects
- Selected state, hover state visual feedback

#### Critical selector compatibility (most important!)

The generated HTML **must** ensure the following CSS selectors correctly target the corresponding elements, since the Chrome extension's content script depends on them:

```javascript
// Sidebar entity list
'.entity.well'                    // each entity item container
'.displayname'                    // entity name
'.entity-status'                  // entity status

// Detail panel
'.entityAttributes .entityLabel'  // current entity name label
'input[name="CHARACTER"]'         // character type radio
'input[name="TOPIC"]'             // term type radio
'input[name="include"]'           // include radio
'input[name="exclude"]'           // exclude radio
'.a-declarative'                  // radio outer wrapper

// Description related
'[data-action="add-description-action"][data-add-description-action*="AUTHOR"]'  // edit description button
'#humanDescriptionDialog'                    // description dialog
'#humanDescriptionDialog .modal-body'        // dialog content area
'#humanDescriptionDialog #humanDescriptionButton'  // submit button
'.entityDescription'              // description text display
'.entityCommentary'               // commentary text display

// Review and aliases
'input[name="doneSwitch"]'        // review status checkbox
'#doneSwitch label.a-switch-label'// review label
'tr.alias'                        // alias list items
'[data-action="remove-alias-action"]'  // alias delete button (must include data-remove-alias-action JSON attribute)
```

#### Data requirements
- Use entity data extracted from the current real page (at least 10-15 entities)
- Include a mix of types (CHARACTER and TOPIC)
- Include different statuses (Needs Review, Approved)
- Some entities with descriptions and aliases, some without
- Define mock data in a JavaScript array for easy modification

#### Interaction requirements
- Click sidebar entity → update right-side detail panel (synchronous JS render is fine)
- Radio buttons (type, include/exclude) → update internal data
- Click "Edit description" button → open modal (add `.in` class and `display: block`)
- Fill in modal and click submit → close dialog and update description display
- Review checkbox change → update status text and visual effect
- Alias delete button → remove alias from DOM and data

#### Test interface
Expose the following on `window` for integration testing:

```javascript
window._mockEntities    // entity data array
window._selectedIndex() // get currently selected index
window._getEntityState() // get snapshot of all entity states (deep copy)
```

### Output format

Output the complete HTML file content without omitting any parts. If too long, output in segments (label "Part 1/N").

Add a comment block at the top of the HTML file noting:
1. This file was generated by Claude in Chrome from a real KDP X-Ray page
2. Generation date
3. Source page book title and ASIN
4. Total number of entities included

### Important notes

- **Do NOT guess or fabricate** DOM structure — if a selector doesn't exist or has a different structure on the real page, note the difference in a comment
- If the real page uses iframes or shadow DOM, flag it
- If some elements are loaded dynamically via AJAX, mock the final state after initial load
- Preserve all extra classes/attributes from the Amazon page related to the listed selectors, even if you think they're unimportant (future versions of the extension may use them)

---

## Usage instructions

1. Log into KDP in the browser and open a book's X-Ray Verify page
2. Wait for the page to fully load (entity list appears)
3. Open the Claude in Chrome extension
4. Paste the above prompt and send
5. Save the returned HTML as `tests/mock-kdp-page-real.html`
6. Open that file in the browser and verify the extension's content script works correctly
