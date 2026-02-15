# Contributing to KDP X-Ray Helper

Thank you for your interest in contributing! This project aims to build a healthy ecosystem of tools for Amazon KDP authors. We welcome bug reports, feature suggestions, and pull requests.

## How to Contribute

### Reporting Bugs

Open a GitHub Issue with:

1. What you expected to happen
2. What actually happened
3. Steps to reproduce
4. Your browser and version (Chrome/Edge)
5. Screenshots if relevant (with any sensitive book data redacted)

### Suggesting Features

Open a GitHub Issue with the `feature-request` label. Describe the problem you're trying to solve and your proposed solution. Discussion is welcome before implementation.

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run all tests and ensure they pass:
   ```bash
   node tests/run-tests-node.js
   node tests/run-integration-node.js
   ```
5. Submit a pull request to the `main` branch

#### PR Guidelines

- Keep PRs focused — one feature or fix per PR
- Add tests for new functionality
- Update the README if your change affects the user-facing workflow
- Follow the existing code style (no build tools, vanilla JS, IIFE modules)

### Updating KDP Selectors

If Amazon updates their KDP X-Ray page and the extension breaks, the CSS selectors in `shared/constants.js` under `XRAY.SEL` are the single place that needs updating. A PR fixing selectors is always high priority.

## Contributor License Agreement (CLA)

By submitting a pull request to this repository, you agree to the following terms:

### 1. Grant of Rights

You grant to the project maintainer (Zhang Cheng) a perpetual, worldwide, non-exclusive, royalty-free, irrevocable license to use, reproduce, modify, distribute, sublicense, and otherwise exploit your contribution in any form, including under the project's open-source license (AGPL-3.0) and any commercial license offered by the maintainer.

### 2. Dual Licensing

You understand and agree that this project uses a dual-license model:

- **Open source**: AGPL-3.0 with additional non-commercial terms (see LICENSE)
- **Commercial**: A separate paid license for commercial organizations

Your contribution may be distributed under both licenses. You will be credited as a contributor.

### 3. Original Work

You represent that your contribution is your original work and that you have the legal right to grant the above license. If your contribution includes third-party code, you must clearly identify it and confirm it is compatible with AGPL-3.0.

### 4. No Obligation

The maintainer is under no obligation to accept any contribution. Submitted PRs may be modified, delayed, or declined at the maintainer's discretion.

### How the CLA Works

No separate signature or paperwork is required. By opening a pull request, you indicate your agreement to these terms. Your PR description should include:

```
I have read and agree to the Contributor License Agreement in CONTRIBUTING.md.
```

## Code of Conduct

- Be respectful and constructive
- Focus on the technical merits of contributions
- Help new contributors get started
- Remember that most users of this tool are authors, not developers — keep the UX simple

## Project Vision

This project is the first tool in what we hope will become a broader ecosystem of open-source tools for Amazon KDP authors. If you have ideas for other KDP-related tools (keyword research, A+ content helpers, sales analytics, etc.), open an Issue to discuss building them within this ecosystem.

## Questions?

Contact the maintainer:

- **Email**: zhangcheng2050@gmail.com
- **GitHub Issues**: For public discussion
