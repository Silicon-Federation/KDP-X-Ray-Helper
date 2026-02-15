# Privacy Policy — KDP X-Ray Helper

**Last updated:** February 2026

## Overview

KDP X-Ray Helper is a browser extension that helps Kindle Direct Publishing (KDP) authors batch-edit X-Ray entities. It runs entirely in your browser and is designed with privacy as a core principle.

## Data Collection

**We do not collect any data.** Specifically:

- No personal information is collected, stored, or transmitted
- No analytics or tracking of any kind
- No cookies for tracking purposes
- No telemetry or usage statistics
- No crash reports sent to external servers

## Data Storage

The extension uses `chrome.storage.session` solely to cache KDP entity data during your current browser session. This data:

- Contains only entity names, types, and descriptions read from the KDP X-Ray page you are editing
- Is stored locally in your browser's session storage
- Is automatically cleared when you close the browser
- Is never transmitted to any external server

## Network Requests

**This extension makes zero network requests.** It does not communicate with any external server, API, or service. All functionality operates entirely within your browser by interacting with the Amazon KDP page DOM.

## Third-Party AI Services

The extension generates a text prompt that you manually copy and paste into an AI service of your choice (e.g., ChatGPT, Claude, Gemini). This is done entirely by you — the extension itself never sends any data to any AI service. You are responsible for reviewing the privacy policy of whichever AI service you choose to use.

## Permissions

The extension requests the following browser permissions:

- **activeTab**: To communicate with the content script on the KDP X-Ray page
- **storage**: To cache entity data in session storage during your editing session
- **sidePanel**: To display the extension interface alongside the KDP page
- **host_permissions (kdp.amazon.com)**: To inject content scripts that read and modify entity data on the KDP X-Ray Verify page

No permissions are used to access data beyond the KDP X-Ray page you are actively editing.

## Your Book Content

Your novel text and book content are never accessed, read, or stored by this extension. The only data the extension reads from the KDP page are X-Ray entity attributes (names, types, descriptions, aliases, and review status).

## Children's Privacy

This extension is not directed at children under 13 and does not knowingly collect any information from children.

## Changes to This Policy

Any changes to this privacy policy will be reflected in this document with an updated date. Since the extension collects no data, meaningful changes are unlikely.

## Contact

If you have questions about this privacy policy, contact:

Zhang Cheng
Email: zhangcheng2050@gmail.com

## Open Source

This extension is open source under AGPL-3.0. You can review the complete source code to verify these privacy claims.
