# Extension Store Listings — SEO Optimized

Both Chrome Web Store and Microsoft Edge Add-ons use the same extension package (.zip).
The same description works for both stores with minor adaptations noted below.

---

## Extension Name (max 75 chars)
```
KDP X-Ray Helper — Batch Edit Kindle X-Ray Entities with AI
```
(60 chars — works for both stores)

## Short Description (max 132 chars — Chrome only)
```
Bulk-edit KDP X-Ray entities with AI. Auto-generate character descriptions, manage aliases, and batch-apply changes to Kindle X-Ray.
```
(132 chars — exactly at Chrome limit, front-loaded with keywords)

## Category
- Chrome Web Store: **Productivity**
- Edge Add-ons: **Productivity** (or "Shopping" if Productivity isn't available)

---

## Detailed Description

Use this for BOTH stores. Edge requires min 250 chars (this is ~2,800 chars).

```
Tired of clicking through KDP X-Ray entities one by one? This extension automates the entire Kindle X-Ray editing workflow — use any AI to generate character descriptions, then batch-apply changes to your KDP X-Ray verification page in minutes.

🔑 WHAT IT DOES

KDP X-Ray Helper reads all your existing X-Ray entities from the Kindle Direct Publishing verification page, generates an AI-ready prompt, and lets you batch-update everything after reviewing a visual diff. No more spending 3-5 hours manually editing entities for a single book.

⚡ KEY FEATURES

• Batch Entity Editing — Update all X-Ray entities at once instead of clicking each one individually
• AI-Powered Descriptions — Works with any AI: Claude, ChatGPT, Gemini, Copilot, or local models (Ollama, LM Studio)
• Visual Diff Review — See exactly what will change before writing to KDP. Approve or reject each entity individually
• Smart Alias Management — Preserves existing aliases and occurrence counts, adds new ones from AI
• Fuzzy Name Matching — Handles typos, nicknames, and name variations with 5-tier matching engine
• Export & Backup — Save your current KDP entity data as JSON before making changes
• 100% Local — No server, no API keys, no accounts. Everything runs in your browser
• Chrome & Edge — Works on any Chromium browser with Side Panel support (v116+)

📋 HOW IT WORKS

1. Open your KDP X-Ray verification page and click the extension icon
2. Click "Generate Prompt" — the extension reads all your entities automatically
3. Copy the prompt into any AI chat along with your novel text
4. Upload the AI's JSON response back into the extension
5. Review the visual diff, approve changes, click "Execute" — done!

⏱️ TIME SAVINGS

For 100 entities: manual editing takes 3-5 hours → with this extension, ~15-20 minutes (10x faster).
For 200+ entities: the savings are even more dramatic.

🔒 PRIVACY & SECURITY

• The extension NEVER sends your data anywhere — all processing happens locally in your browser
• No analytics, no telemetry, no tracking
• Your novel text only leaves your computer when YOU paste it into your chosen AI
• Works with privacy-focused options: local models (Ollama), Claude (no training by default), or partial text excerpts

📖 PERFECT FOR

• Self-published authors on Amazon KDP
• Indie authors managing multiple books
• Publishers handling X-Ray for their catalog
• Authors who update manuscripts and need to re-do X-Ray descriptions
• Anyone who finds the KDP X-Ray verification page tedious and time-consuming

🤖 WORKS WITH ANY AI

This extension doesn't lock you into a specific AI service. It generates a plain-text prompt that works with:
• Claude (claude.ai) — Recommended for quality
• ChatGPT (chat.openai.com)
• Google Gemini
• Microsoft Copilot
• Local/self-hosted models (Ollama, LM Studio, etc.) — for maximum privacy
• Any AI that can output JSON

💡 WHY X-RAY MATTERS

Kindle X-Ray lets readers tap on any character name or term to see a description. Well-written X-Ray entries make your book feel professional, help readers keep track of complex casts, and improve the overall reading experience. Amazon recommends all authors fill in X-Ray content — but their tool makes it painfully slow. This extension fixes that.

📬 SUPPORT & FEEDBACK

Found a bug or have a feature request? Visit our GitHub repository to file an issue. We actively maintain this extension and welcome contributions from the self-publishing community.
```

---

## Chrome Web Store — Specific Fields

### Search Keywords
```
KDP, X-Ray, Kindle, batch edit, bulk edit, entity editor, character descriptions,
self-publishing, indie author, Amazon KDP, automation, AI descriptions,
X-Ray verification, Kindle Direct Publishing, book publishing tools
```

### Permission Justifications

| Permission | Justification |
|-----------|---------------|
| activeTab | Required to read and modify X-Ray entity data on the active KDP verification page. The extension reads entity names, types, descriptions, and aliases from the page DOM, and writes approved changes back. |
| storage | Stores user preferences (e.g., UI state). No personal data is stored. |
| sidePanel | The extension's main UI is a side panel that shows alongside the KDP X-Ray verification page, allowing users to review and manage entities without leaving the page. |
| Host permission (kdp.amazon.com) | Required to inject content scripts that read and modify the KDP X-Ray verification page DOM. The extension only operates on `https://kdp.amazon.com/xray/verify/*` pages. |

### Single Purpose
```
Automate KDP X-Ray entity editing: read existing entities from the KDP verification page, generate an AI prompt for enriched descriptions, compare AI results with current KDP data via visual diff, and batch-apply approved changes.
```

### Remote Code
```
No. All code runs locally in the browser. No remote scripts, no CDN imports, no eval().
```

### Data Usage
All checkboxes: **NOT checked** — the extension collects no user data.

### Privacy Certifications
All three checkboxes: **Checked**. Optional privacy policy URL: link to PRIVACY.md on GitHub.

---

## Microsoft Edge Add-ons — Specific Fields

### Submission Checklist

1. **Developer account**: Register free at [Microsoft Partner Center](https://partner.microsoft.com/dashboard/microsoftedge/overview)
2. **Package**: Same .zip file used for Chrome Web Store (no changes needed)
3. **Description**: Same as above (meets Edge's 250-char minimum)
4. **Screenshots**: Same 1280×800 screenshots work for both stores
5. **Privacy policy URL**: Same as Chrome (link to PRIVACY.md on GitHub)
6. **Testing instructions**: "Navigate to https://kdp.amazon.com/xray/verify/ on any published Kindle ebook. Click the extension icon to open the side panel. Click 'Generate Prompt' to read entities."
7. **Category**: Productivity
8. **Supported languages**: English

### Edge-Specific Notes
- No `update_url` field in manifest.json ✓ (already clean)
- No "Chrome" branding in extension name or description ✓ (uses "Chrome & Edge")
- No `chrome.runtime.connectNative` usage ✓ (not applicable)
- Edge uses the same `chrome.*` API namespace ✓ (fully compatible)
- Side Panel API supported in Edge 116+ ✓

### Edge Add-ons Store URL (after approval)
```
https://microsoftedge.microsoft.com/addons/detail/kdp-x-ray-helper/[EXTENSION_ID]
```

---

## GitHub Repository SEO

### Repo Description (max 350 chars)
```
Chrome/Edge extension to batch-edit Kindle X-Ray entities with AI — auto-generate character descriptions, manage aliases, and batch-apply changes to KDP. 10x faster than manual editing. Works with Claude, ChatGPT, Gemini, or local models. Free & open source.
```

### Topics/Tags
```
kdp, kindle, x-ray, xray, chrome-extension, edge-extension, self-publishing,
kindle-direct-publishing, automation, ai-tools, indie-author, book-publishing,
batch-editing, productivity, amazon-kdp
```

### Social Preview Image
Use screenshot-1-hero.png (1280×800) as the GitHub social preview image for link unfurling.
