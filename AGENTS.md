# AGENTS.md

## Mission

Build and maintain a local-first web application for importing, reviewing, classifying, and scoring YouTube quiz comments. The application is for the repository owner's own channel-management workflow.

## Read order

Before changing code, read these files in order:

1. `README.md`
2. `AGENTS.md`
3. `docs/BUILD_PROMPT.md`
4. `docs/PRODUCT_SPEC.md`
5. `docs/ARCHITECTURE.md`
6. `docs/POLICY_AND_PRIVACY.md`
7. `docs/PROGRESS_LOG.md`

If repository code and documentation conflict, stop, inspect git history, and update the documentation as part of the same change.

## Non-negotiable boundaries

- Work only in `Zoeruijtje/YT-game`.
- Keep source code, tests, configuration templates, migrations, and documentation in GitHub.
- Never commit runtime data or secrets: cookies, browser profiles, tokens, credentials, collected comments, author/channel identifiers, SQLite database files, exports, screenshots containing personal data, or logs containing source data.
- Add comprehensive `.gitignore` coverage before implementing collection.
- Do not bypass authentication, CAPTCHAs, consent dialogs, robots controls, rate limits, access controls, geographical restrictions, or anti-bot systems.
- Do not use stealth plugins, CAPTCHA-solving services, proxy rotation, fingerprint spoofing, or techniques intended to conceal automation.
- Do not request or store a user's Google password.
- Stop collection cleanly when YouTube presents a challenge, blocks access, or changes the page structure.
- Treat the temporary browser collector as an isolated prototype provider. The official YouTube Data API provider is the intended long-term provider.
- The program must never post, edit, delete, like, or reply to YouTube comments.
- Do not build points for likes, subscriptions, sharing, repeated comments, or comment likes.

## Required engineering approach

- Use TypeScript throughout unless a documented blocker requires otherwise.
- Use a local web UI with a local server process.
- Prefer boring, well-supported dependencies.
- Separate ingestion from domain logic with a provider interface.
- Store persistent local data in SQLite via Prisma.
- Use immutable import runs and comment snapshots where practical.
- Preserve source evidence and make manual overrides auditable.
- Make the scoring engine deterministic and extensively unit tested.
- Treat all externally supplied strings as untrusted.
- Validate all inputs with Zod or an equivalent schema validator.
- Escape rendered comment text; never render source HTML as trusted HTML.
- Use database transactions for finalisation and scoring.
- Use UTC internally; display the operator's local timezone separately.
- Do not silently infer facts the source does not expose. Missing metadata must remain `unknown`, not guessed.

## Required workflow for every implementation phase

1. Inspect the existing repository and git status.
2. State the phase objective and acceptance criteria in the work log.
3. Implement the smallest coherent vertical slice.
4. Add or update tests.
5. Run formatting, linting, type checking, unit tests, integration tests, and a production build.
6. Manually verify the affected UI using realistic fixture data.
7. Update `docs/PROGRESS_LOG.md`, `docs/ARCHITECTURE.md`, and `README.md` when relevant.
8. Commit with a focused conventional commit message.
9. Push all non-sensitive project files to GitHub.

## Quality gates

Do not claim completion unless all applicable commands pass:

- formatting check;
- lint;
- TypeScript type check;
- unit tests;
- integration tests;
- production build;
- database migration from a clean database;
- browser smoke test of the primary workflow.

Do not disable tests or weaken type safety merely to make CI pass.

## UI expectations

- Desktop-first but responsive down to mobile widths.
- Clear, information-dense, professional admin UI.
- Keyboard-accessible controls and visible focus states.
- Do not rely on colour alone for status.
- Long comments must wrap and remain readable.
- Large collections must use server-side pagination or virtualisation.
- Destructive actions and scoring finalisation require confirmation.
- Every automatic classification must expose its reason.

## Documentation expectations

- Record decisions and trade-offs, not only outcomes.
- Document exact setup commands for Windows/PowerShell and WSL where relevant.
- Keep `.env.example` complete but secret-free.
- Maintain a data dictionary for all persisted fields.
- Record known source limitations, especially edited-state and stable-author-identifier limitations in browser collection.

## Definition of done for the MVP

The MVP is complete only when an operator can:

1. Start the application locally from documented commands.
2. Paste a supported YouTube video URL.
3. Preview video metadata and choose collection options.
4. Run a temporary browser-based import or import a saved fixture/export.
5. Re-run collection without duplicating records.
6. Find the automatically named collection later.
7. Search, filter, sort, inspect, invalidate, restore, and override comments.
8. Configure an A/B/C answer parser, deadline, and correct answer.
9. Apply first-answer, duplicate, edited, late, malformed, and manual rules deterministically.
10. View case totals, crowd distribution, valid entries, invalid reasons, and provisional scores.
11. Export CSV and JSON.
12. Back up and restore local data.
13. Run all tests and build successfully.
14. Swap the collection provider later without changing the UI or scoring engine contracts.
