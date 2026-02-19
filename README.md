# KDP X-Ray Helper — Batch Edit Kindle X-Ray Entities with AI

A free Chrome/Edge extension that lets you **bulk-edit KDP X-Ray entities** using any AI (Claude, ChatGPT, Gemini, or local models). Auto-generate character descriptions, manage aliases, and batch-apply changes to Amazon Kindle Direct Publishing — no more clicking through entities one by one.

> **For indie authors and self-publishers** who want to save hours on KDP X-Ray verification. Works with any book, any genre, any number of entities.

## Why KDP X-Ray Editing Is So Painful

Amazon's X-Ray for Authors tool has no bulk edit feature. The X-Ray verification page forces you to click each entity individually — set its type (CHARACTER or TERM), write a description (up to 1,175 characters), add aliases, and toggle "Item reviewed." For a novel with 100–300 entities, this means 3–5 hours of tedious, repetitive clicking. If you update your manuscript later, Amazon may overwrite your custom descriptions entirely.

This extension solves the problem: **generate AI-powered descriptions for all entities at once, review a visual diff, and batch-apply approved changes in minutes instead of hours.**

## How Does It Work?

The extension uses a **prompt-based workflow** — it does not call any AI API directly and never sends your data to any server. Instead, it generates a prompt containing your current KDP X-Ray entities, which you paste into any AI chat (Claude, ChatGPT, Gemini, or even a local model like Ollama) along with your novel text. The AI returns a JSON file with enriched descriptions, and the extension batch-applies the changes to KDP automatically.

### 3-Step Workflow

```
Step 1: Generate Prompt (one-time entity scan)
  Extension reads all KDP entities (navigates each one to get full details)
  ↓
  Generates a prompt with existing entity data embedded
  ↓
  You copy the prompt + paste your novel text into any AI

Step 2: Upload AI Result & Review Changes
  AI returns a JSON file with enriched descriptions
  ↓
  You upload or paste the JSON into the extension
  ↓
  Click "Compare with KDP" (instant — uses cached data from Step 1)
  ↓
  Review the visual diff, approve/reject individual changes

Step 3: Batch Execute
  Click "Execute Approved Changes"
  ↓
  Extension auto-fills descriptions, sets types, adds aliases, marks as reviewed
  ↓
  All approved entities updated in minutes, not hours
```

## Key Features

- **Batch entity editing** — Update all KDP X-Ray entities in one click instead of clicking through each one manually
- **AI-powered descriptions** — Generate character and term descriptions using any AI (Claude, ChatGPT, Gemini, Ollama, or any model that outputs JSON)
- **Visual diff review** — See exactly what will change before anything is written to KDP, with approve/reject per entity
- **Smart alias management** — Import aliases with occurrence counts; the AI preserves existing aliases and adds missing ones
- **Fuzzy entity matching** — 5-tier matching engine (exact, fuzzy, partial, alias, reverse-alias) handles name variations and typos
- **Export & backup** — Quick-export your current KDP entity data as JSON before making changes
- **No API keys required** — The extension runs entirely in your browser. No accounts, no subscriptions, no server
- **Works offline** — All entity reading, comparison, and batch execution happen locally on the KDP page DOM
- **Chrome & Edge** — Compatible with any Chromium browser that supports the Side Panel API (v116+)

## FAQ

### Why does the entity scan click through every item?

KDP's X-Ray verification page has no API or batch-read endpoint. The only way to read an entity's full data (type, description, aliases, occurrence counts) is to physically click on it in the sidebar and parse the loaded detail panel. The extension does this automatically — it takes a few seconds per entity but only happens once per session. The result is cached in memory, so subsequent operations like "Compare with KDP" are instant.

### Can I delete X-Ray entities with this tool?

The extension deliberately does not delete entities. KDP X-Ray entries are algorithmically suggested by Amazon based on your book's content — they help readers understand characters and terms while reading. Removing them could hurt the reading experience. Instead, the AI is instructed to **enrich** all existing entities with better descriptions and add any missing ones.

### Is my novel text safe? Does the extension send data anywhere?

**The extension itself never transmits your data anywhere.** It runs entirely in your browser — all entity reading, comparison, and batch execution happen locally on the KDP page DOM. No server, no analytics, no telemetry. You can verify this: the extension only has `host_permissions` for `https://kdp.amazon.com/*` and makes zero outbound network requests.

The only moment your novel text leaves your computer is when **you** manually paste it into an AI chat in Step 1. That part is governed by whichever AI service you choose:

- **Claude (claude.ai)**: Anthropic does not use your conversations to train models by default. See [Anthropic's privacy policy](https://www.anthropic.com/privacy).
- **ChatGPT**: OpenAI may use your data for training unless you opt out via "Data Controls" in account settings.
- **Local/self-hosted models**: If confidentiality is critical (e.g., unpublished manuscripts under NDA), you can run a local model via Ollama, LM Studio, etc. The extension's prompt is plain text — any model that returns JSON will work.
- **Partial text**: You don't have to paste the entire novel. Key chapters or a detailed synopsis is often enough for the AI to write accurate entity descriptions.

### Will Amazon detect or block the automation?

The extension simulates normal user interactions — clicking, typing, toggling switches — with human-like delays between actions (300–800ms per operation). From Amazon's perspective, it looks like a user manually editing entities, just faster. That said, there are no guarantees. Use at your own discretion. A "Stop" button is available to halt batch execution at any time.

### What if the AI writes a bad description? Can I review before applying?

This is exactly why the **Compare** step exists. After uploading the AI's JSON, you see a full visual diff of every proposed change before anything touches KDP. You can approve or reject each entity individually. Nothing is written to KDP until you explicitly click "Execute Approved Changes." Think of the AI as a draft writer and yourself as the editor.

### Can I undo changes after batch execution?

There is no built-in undo. However, you can save a backup beforehand using the "Quick Export" feature, which exports your current KDP entity data as JSON. KDP itself also has a "Reset" option on the X-Ray verification page that restores Amazon's original algorithmic suggestions.

### Do X-Ray descriptions really matter for Kindle readers?

Yes — X-Ray descriptions are shown to Kindle readers when they highlight a character name or term. A well-written, spoiler-free description significantly improves the reading experience and makes your book feel more polished and professional. The AI prompt is specifically designed to generate concise, reader-friendly descriptions (max 1,175 characters) that explain who a character is or what a term means without revealing plot twists.

### How much time does this actually save?

For a typical novel with 100 entities: manual editing takes 3–5 hours (clicking each entity, writing descriptions, managing aliases). With this extension, the same work takes about 15–20 minutes — a **10x productivity gain**. The breakdown: ~5 min for entity scan, ~5 min for AI to generate descriptions, ~5 min to review the diff and execute. For books with 200+ entities, the time savings are even more dramatic.

## Installation

### Option A: Install from Store (recommended)

- **Chrome Web Store**: [KDP X-Ray Helper](https://chromewebstore.google.com/detail/kdp-x-ray-helper/hmenaajhebnnnelmmeckkeiafpciegcg) — click "Add to Chrome"
- **Edge Add-ons**: [KDP X-Ray Helper](https://microsoftedge.microsoft.com/addons/detail/TODO) — click "Get" (coming soon)

### Option B: Load Unpacked (developer mode)

1. Clone or download this repository
2. Open `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the project folder

No API keys or configuration needed — the extension works with any AI chat.

## Usage

1. Navigate to your KDP X-Ray verification page (`https://kdp.amazon.com/xray/verify/YOUR_ASIN`)
2. Click the extension icon to open the Side Panel
3. Click **Generate Prompt** — the extension reads all your KDP entities and builds a prompt
4. Copy the prompt, paste it into any AI (Claude, ChatGPT, etc.) along with your novel text
5. Download or copy the AI's JSON response
6. Upload or paste the JSON into the extension, click **Validate JSON**
7. Click **Compare with KDP** to see a diff of your data vs. KDP's current data
8. Review the diff, approve or reject individual changes
9. Click **Execute Approved Changes** to auto-apply everything on the KDP page

## JSON Format

The expected JSON format (produced by the AI, or manually):

```json
[
  {
    "name": "Kyle Chen",
    "type": "CHARACTER",
    "description": "A quantum physicist who discovers an anomaly in the fabric of spacetime.",
    "aliases": ["Kyle", "Dr. Chen"],
    "action": "update"
  },
  {
    "name": "Shadowlands",
    "type": "TERM",
    "description": "A mysterious realm between dimensions, accessible only through quantum tunneling.",
    "aliases": ["the Shadows"],
    "action": "add"
  }
]
```

| Field | Required | Values |
|-------|----------|--------|
| `name` | Yes | Entity name (must match KDP's name exactly for `update` items) |
| `type` | Yes | `CHARACTER` or `TERM` |
| `description` | No | Up to 1175 characters, spoiler-free |
| `aliases` | No | Array of alternate names/spellings |
| `action` | No | `update` (default) or `add` |

If `action` is omitted, it defaults to `update`.

## Project Structure

```
├── manifest.json              # Extension manifest (Manifest V3)
├── background.js              # Service worker — side panel lifecycle + message routing
├── _locales/                  # Chrome i18n (en)
├── shared/
│   ├── constants.js           # KDP DOM selectors, timing, limits, message types
│   ├── i18n.js                # UI string constants (English)
│   ├── diff-engine.js         # Levenshtein distance + 5-tier fuzzy matching
│   ├── api-client.js          # JSON parsing utilities (parseEntityJSON, chunkText)
│   └── storage.js             # chrome.storage helper
├── content/
│   ├── content.js             # Content script entry — message router
│   ├── dom-reader.js          # Read entities from KDP DOM (quick + detailed export)
│   ├── dom-writer.js          # Write to KDP DOM — click radios, fill descriptions, toggle review
│   └── batch-executor.js      # Sequential batch processor with cancel support
├── sidepanel/
│   ├── sidepanel.html         # Side Panel UI — 4 tabs
│   ├── sidepanel.css          # Styles
│   ├── sidepanel.js           # Main panel logic — prompt generation, import, compare, execute
│   ├── diff-viewer.js         # Visual diff cards with approve/reject
│   ├── entity-editor.js       # Inline entity editor
│   └── batch-controls.js      # Progress bar, start/stop controls
├── icons/                     # Extension icons (16/48/128px)
└── tests/
    ├── run-tests-node.js      # 65 unit tests (headless, Node.js)
    ├── run-integration-node.js# 58 integration tests (DOM read/write)
    └── mock-kdp-page.html     # Mock KDP DOM for integration testing
```

## How the Diff Engine Works

The extension matches imported entities to KDP's existing ones using a 5-tier scoring system:

1. **Exact match** (score = 1.0) — names are identical (case-insensitive)
2. **Fuzzy match** (score > 0.8) — Levenshtein similarity above threshold (handles typos)
3. **Partial match** — one name is a substring of the other (e.g., "Kyle" → "Kyle Chen")
4. **Alias match** — the imported name matches one of KDP's aliases
5. **Reverse alias match** — one of the imported aliases matches the KDP entity name

Each entity pair is classified as `update`, `keep`, `add`, `import_only`, or `kdp_only`, and displayed as a visual diff card in the Compare tab.

## Alias Data

When generating the prompt, the extension extracts rich alias information from KDP including occurrence counts and display name flags. This helps the AI make better decisions about which aliases to keep, add, or prioritize.

## Testing

All tests run in Node.js (no browser required):

```bash
# Unit tests — constants, i18n, diff engine, JSON parsing
node tests/run-tests-node.js        # 65 tests

# Integration tests — DOM reader/writer, batch workflow
node tests/run-integration-node.js  # 58 tests
```

123 tests total (65 unit + 58 integration).

## Browser Compatibility

- Google Chrome 116+ (Side Panel API required)
- Microsoft Edge 116+

## Contributing

Issues, bug reports, and pull requests are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines and the Contributor License Agreement.

If Amazon changes their KDP X-Ray page structure, the CSS selectors in `shared/constants.js` are the single place that needs updating — PRs for selector fixes are always high priority.

## License

This project uses a **dual-license** model:

**Open Source** — [AGPL-3.0](LICENSE) with additional non-commercial terms. Individual authors and non-profit organizations may use this software free of charge. All derivative works must remain open-source under the same license and must credit the original project.

**Commercial** — For-profit organizations must obtain a [Commercial License](COMMERCIAL-LICENSE.md). Contact zhangcheng2050@gmail.com for details.

## Disclaimer

This software is not affiliated with, endorsed by, or sponsored by Amazon, Kindle, or Kindle Direct Publishing (KDP). It automates interactions with the KDP X-Ray verification page through browser DOM manipulation. Use at your own risk. "Kindle," "KDP," and "X-Ray" are trademarks of Amazon.com, Inc.

---

**Built for indie authors and self-publishers** who want to spend less time on KDP X-Ray entity management and more time writing. If this tool saves you time, consider starring the repo or sharing it with fellow authors.
