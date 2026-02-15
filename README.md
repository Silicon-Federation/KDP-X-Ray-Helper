# KDP X-Ray Helper

A Chrome/Edge extension that automates Kindle Direct Publishing (KDP) X-Ray entity editing. Use any AI (Claude, ChatGPT, etc.) to enrich your entities, then batch-apply changes to KDP in one click.

## Why This Exists

KDP's X-Ray verification page requires authors to manually click through each entity one by one — setting type, writing descriptions, managing aliases, and marking as reviewed. For a novel with 200+ entities, this is hours of tedious work. This extension automates that entire process.

## How It Works

The extension uses a **prompt-based workflow** — it does not call any AI API directly. Instead, it generates a prompt containing your current KDP entities, which you paste into any AI chat along with your novel text. The AI returns a JSON file that the extension can then apply to the KDP page automatically.

### Workflow

```
Step 1: Generate Prompt
  Extension reads all KDP entities (navigates each one to get full details)
  ↓
  Generates a prompt with existing entity data embedded
  ↓
  You copy the prompt + paste your novel text into any AI

Step 2: Upload AI Result
  AI returns a JSON file
  ↓
  You upload or paste the JSON into the extension
  ↓
  Click "Compare with KDP" (instant — uses cached data from Step 1)
  ↓
  Review the diff, approve/reject individual changes
  ↓
  Click "Execute Approved Changes" to auto-apply everything
```

### Why does "Generate Prompt" click through every entity?

KDP's page structure requires physically clicking on each entity in the sidebar to load its detail panel (type, description, aliases). There is no API or batch endpoint — the only way to read an entity's full data is to select it and parse the DOM. This "detailed export" takes a few seconds per entity but only happens once. The result is cached, so "Compare with KDP" is instant.

### Why doesn't the AI ever delete entities?

KDP X-Ray entities are algorithmically suggested by Amazon based on the book's content. They exist to help readers understand characters and terms while reading. Deleting them could hurt the reading experience — a reader might encounter a name they don't recognize and find no X-Ray entry for it. Instead, the AI is instructed to **enrich** all existing entities with better descriptions and add any missing ones.

### Is my novel text safe? (Content confidentiality)

**The extension itself never transmits your data anywhere.** It runs entirely in your browser — all entity reading, comparison, and batch execution happen locally on the KDP page DOM. No server, no analytics, no telemetry. You can verify this: the extension only has `host_permissions` for `https://kdp.amazon.com/*` and makes zero outbound network requests.

The only moment your novel text leaves your computer is when **you** manually paste it into an AI chat in Step 1. That part is governed by whichever AI service you choose:

- **Claude (claude.ai)**: Anthropic does not use your conversations to train models by default. See [Anthropic's privacy policy](https://www.anthropic.com/privacy).
- **ChatGPT**: OpenAI may use your data for training unless you opt out via "Data Controls" in account settings.
- **Local/self-hosted models**: If confidentiality is critical (e.g., unpublished manuscripts under NDA), you can run a local model via Ollama, LM Studio, etc. The extension's prompt is plain text — any model that returns JSON will work.
- **Partial text**: You don't have to paste the entire novel. Key chapters or a detailed synopsis is often enough for the AI to write accurate entity descriptions.

### Will Amazon detect the automation?

The extension simulates normal user interactions — clicking, typing, toggling switches — with human-like delays between actions (300–800ms per operation). From Amazon's perspective, it looks like a user manually editing entities, just faster. That said, there are no guarantees. Use at your own discretion. A "Stop" button is available to halt batch execution at any time.

### What if the AI makes mistakes?

This is exactly why the **Compare** step exists. After uploading the AI's JSON, you see a full visual diff of every proposed change before anything touches KDP. You can approve or reject each entity individually. Nothing is written until you explicitly click "Execute Approved Changes." Think of the AI as a draft writer and yourself as the editor.

### Can I undo changes after execution?

There is no built-in undo. However, you can save a backup beforehand using the "Quick Export" feature, which exports your current KDP entity data as JSON. KDP itself also has a "Reset" option on the X-Ray verification page that restores Amazon's original algorithmic suggestions.

### Does the description quality matter for readers?

Yes — X-Ray descriptions are shown to Kindle readers when they highlight a character name or term. A well-written, spoiler-free description significantly improves the reading experience. The AI prompt is specifically designed to generate concise, reader-friendly descriptions (max 1175 characters) that explain who a character is or what a term means without revealing plot twists.

## Installation

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

This software is not affiliated with, endorsed by, or sponsored by Amazon. It automates interactions with the KDP X-Ray verification page through browser DOM manipulation. Use at your own risk.
