# Master implementation prompt — YT-game local comment manager

You are the lead engineer responsible for building the application in the existing GitHub repository `Zoeruijtje/YT-game`.

Do not create a different repository. Inspect the repository and current branch before changing anything. Read `README.md`, `AGENTS.md`, and every file in `docs/` first. Treat those documents as the product contract. Keep all source code, tests, migrations, configuration templates, and documentation in this repository and push each completed phase to GitHub. Never commit runtime data, collected comments, channel identifiers, browser profiles, cookies, credentials, tokens, database files, exports, or logs containing personal data.

## Objective

Build a polished local-first web application that lets one operator paste a YouTube video URL, collect the publicly visible comments for that chosen video into a persistent local collection, inspect all available evidence, classify quiz answers, invalidate edited/duplicate/late/malformed answers, calculate provisional case results, and export the data.

The temporary collection mechanism is not the long-term architecture. Implement it behind a provider interface so an official YouTube Data API provider can replace it later without changing the UI, database model, comment-review workflow, or scoring engine.

The program is for local use only. It must bind to `127.0.0.1` by default and require no cloud account or hosted service.

## Important policy and safety constraints

The public-page collector is a temporary prototype and may be incompatible with YouTube's Terms of Service. Build it only as an isolated, explicitly labelled provider. Do not claim that it is authorised by YouTube.

The collector must:

- access only a public YouTube watch page selected by the operator;
- never request or store a Google password;
- not automate sign-in;
- not bypass login gates, CAPTCHAs, consent requirements, rate limits, access controls, robots controls, geographical restrictions, or anti-bot systems;
- not use stealth plugins, proxy rotation, CAPTCHA solvers, browser fingerprint spoofing, or concealment techniques;
- stop safely and report a clear error when a challenge, block, unsupported page, or structural change is detected;
- collect conservatively with configurable delays and no parallel page sessions by default;
- never post, edit, delete, like, heart, pin, or reply to a YouTube comment;
- never expose the local server to the LAN or internet by default.

Also provide a fixture/import provider so all application features can be developed and tested without contacting YouTube.

## Required stack

Use this stack unless repository evidence shows a concrete blocker:

- Node.js 22.19 or newer compatible LTS;
- pnpm workspaces;
- TypeScript with strict mode;
- React + Vite for the web UI;
- React Router;
- TanStack Query for server state;
- TanStack Table for large data tables;
- Tailwind CSS and accessible headless components or shadcn/ui;
- Fastify for the local HTTP server;
- SQLite with Drizzle ORM and migration files;
- Zod for input and boundary validation;
- Playwright for the temporary public-page provider and browser tests;
- Vitest for unit and integration tests;
- Pino for structured logs with redaction;
- ESLint and Prettier;
- Server-Sent Events for import progress unless a simpler robust mechanism is demonstrably better.

Do not add Docker as a requirement. Docker may be optional later, but the normal setup must work directly on Windows/PowerShell and WSL.

## Recommended repository structure

Use a clear workspace structure similar to:

```text
YT-game/
  apps/
    web/
    server/
  packages/
    domain/
    database/
    collectors/
    shared/
  docs/
  scripts/
  fixtures/
  data/             # runtime only; gitignored
  exports/          # runtime only; gitignored
  browser-data/     # runtime only; gitignored
```

Adjust the exact structure only when the alternative is simpler and document the decision.

## Core architectural rule: collector adapters

Define a stable interface such as:

```ts
interface CommentCollector {
  readonly providerId: string;
  inspectVideo(input: InspectVideoInput): Promise<VideoInspection>;
  collectComments(
    input: CollectCommentsInput,
    context: CollectorContext,
  ): AsyncIterable<CollectorEvent>;
}
```

Provide at least:

1. `fixture` provider — deterministic JSON fixtures used by tests and demos;
2. `public-page-playwright` provider — temporary browser collector;
3. `youtube-data-api` provider stub — interface, configuration shape, and documentation only for now; no fake implementation.

No UI component, scoring function, or database service may contain provider-specific DOM selectors.

## Video input and collection creation

Accept common public YouTube URL forms, including:

- `https://www.youtube.com/watch?v=VIDEO_ID`;
- `https://youtu.be/VIDEO_ID`;
- Shorts URLs;
- URLs containing additional query parameters.

Validate and normalise the video ID. Reject unsupported hosts and malformed IDs.

On preview, collect only metadata available without bypassing restrictions:

- video ID;
- canonical URL;
- title;
- channel display name;
- channel URL/identifier when exposed;
- thumbnail URL;
- publication text/time when exposed;
- comments-disabled state when determinable.

When first saved, create one persistent collection per video by default. Generate a human-readable name:

```text
<sanitised video title> [<video ID>]
```

If the title is unavailable:

```text
YouTube video <video ID>
```

The operator may rename the collection. Re-importing the same video must reuse the existing collection unless the operator explicitly chooses to create a separate collection. Every import creates a separately timestamped import run.

## Temporary browser collector requirements

Use an ordinary Playwright Chromium session in headful mode by default so the operator can see what is happening. Headless mode may exist as an opt-in setting.

The collector should:

1. Open the selected public video page.
2. Detect unsupported states: unavailable video, age/login gate, consent gate that requires operator action, comments disabled, challenge/CAPTCHA, or page structure failure.
3. Wait for the comment area using resilient accessible selectors and layered fallbacks.
4. Scroll gradually to load comments.
5. Expand `Read more` text when possible.
6. Optionally expand replies when the operator enabled reply collection.
7. Continue until one of these conditions occurs:
   - no new top-level comments are observed for a configurable number of passes;
   - an operator-specified maximum is reached;
   - a configurable time limit is reached;
   - the operator cancels;
   - a challenge/block/error occurs.
8. Emit progress events: phase, observed count, unique count, duplicate snapshot count, warnings, elapsed time, and current stop reason.
9. Persist incrementally so a cancelled run does not lose all progress.
10. Close its browser context cleanly.

Do not rely on one fragile CSS selector. Centralise selectors and extraction logic inside the provider. Add fixture-based parser tests. When the page changes, fail with an actionable provider-health error rather than silently returning zero comments.

## Information to capture per comment

Capture all available fields without inventing unavailable values. The data model must distinguish `unknown`, `not observed`, and an explicit false value.

Required fields include:

- internal record ID;
- collection ID;
- import run ID;
- provider ID;
- source comment ID when exposed;
- source parent comment ID for replies when exposed;
- top-level/reply kind;
- comment permalink when exposed;
- author display name;
- author handle when exposed;
- canonical author/channel URL when exposed;
- stable channel ID when actually exposed;
- derived author key and its confidence/source;
- avatar URL when exposed;
- plain comment text;
- normalised comment text used by parsing;
- publication label exactly as displayed;
- parsed publication timestamp only when reliable;
- first observed timestamp;
- last observed timestamp;
- source update timestamp when exposed;
- edited-state enum;
- edited evidence, such as a visible edited marker or changed text between snapshots;
- like count raw label;
- parsed numeric like count when reliable;
- creator-heart state when exposed;
- pinned state when exposed;
- author-is-video-owner state when exposed;
- reply count when exposed;
- visibility/moderation state when exposed;
- extraction warnings;
- identity confidence;
- content hash;
- source snapshot JSON containing only the extracted per-comment evidence, not full page HTML.

### Edited-state model

Use an enum such as:

```text
edited_confirmed
edited_observed_between_imports
not_marked_edited
unknown
```

Never equate missing source metadata with certainty. If a visible `(edited)` marker is present, set `edited_confirmed`. If a stable source comment ID is re-observed with changed text, preserve the original snapshot and set `edited_observed_between_imports`. If the provider cannot determine edited status, store `unknown`.

### Author identity model

Prefer, in order:

1. stable channel ID explicitly exposed;
2. canonical channel URL;
3. canonical handle URL;
4. provider-specific source author reference;
5. a low-confidence fallback fingerprint.

Never treat display names as unique. The review UI must show identity confidence and allow the operator to merge or split player identities manually.

## Snapshot and import behaviour

- Import runs are immutable audit records.
- Upsert current comment records using the strongest available source identity.
- Preserve comment snapshots so changes can be explained later.
- Re-running an import must not create duplicate current comments.
- A missing comment in a later run must not be automatically treated as deleted unless the run was complete enough to support that conclusion.
- Track import completeness and stop reason.
- Never overwrite the original first-seen text.
- Manual edits in the app must be stored as overrides, never as destructive changes to source evidence.

## Web UI

Build a polished, information-dense admin interface with these pages.

### Dashboard

Show:

- total collections;
- recent collections;
- latest import runs;
- comments collected;
- entries awaiting review;
- provider health;
- quick action to add a video.

### Add video / start import

Include:

- URL field;
- URL validation;
- metadata preview;
- existing-collection detection;
- generated collection-name preview;
- provider selection;
- top-level-only or include-replies option;
- maximum comments;
- maximum runtime;
- headful/headless toggle;
- conservative delay setting;
- clear policy warning for the temporary provider;
- start/cancel controls;
- live progress and warnings.

### Collections list

Allow search, sorting, and filters. Display title, video ID, channel, total comments, valid entries, last import, import state, and case state.

### Collection detail

Use tabs or equivalent sections:

1. Overview;
2. Comments;
3. Quiz rules;
4. Results;
5. Import runs;
6. Exports;
7. Audit log.

### Comments table

Support server-side pagination and these columns or expandable details:

- validity/status;
- parsed answer;
- author display name and handle;
- identity confidence;
- comment text;
- published/observed time;
- edited state;
- top-level/reply;
- likes;
- first/duplicate indicator;
- invalid reason;
- import run;
- source link.

Filters must include answer, valid/invalid, invalid reason, edited state, duplicate state, late state, top-level/reply, identity confidence, import run, date range, and free text.

Actions:

- invalidate with required reason;
- restore automatic result;
- override parsed answer;
- merge/split player identity;
- add operator note;
- inspect evidence and snapshot history;
- bulk invalidate/restore;
- export selected rows.

Every manual action must produce an audit event.

## Quiz configuration and scoring

For each collection, support an optional quiz configuration:

- case number;
- question/title;
- allowed answers, initially A/B/C but model this as configurable choices;
- answer parser rules;
- exact UTC close timestamp;
- display timezone;
- correct answer, initially unset;
- whether replies are eligible, default false;
- edited-answer policy, default invalid;
- unknown-edited-state policy, default `review_required`;
- duplicate policy, fixed to earliest official answer wins for the MVP;
- late-answer policy, default invalid;
- malformed-answer policy, default invalid;
- scoring values;
- case state: draft, open, closed, reviewed, finalised, void.

### Default answer parsing

A top-level comment is an official answer when its trimmed text begins unambiguously with one allowed choice. Accept examples such as:

```text
A
B because the URL is wrong
Answer: C
C - the seam is unsupported
```

Reject ambiguous examples such as:

```text
A or B
I think it is probably B
My friend chose C
ABC
```

Make parser rules visible and testable in the UI. Show why each comment did or did not parse.

### First-answer and duplicate rules

For each resolved player identity:

1. Order parseable official-answer comments by the best available publication time, then first-observed time, then a stable tie-breaker.
2. The earliest official-answer comment becomes the attempt.
3. All later official-answer comments are `duplicate_invalid` and worth zero.
4. If the first attempt is edited under the configured policy, it remains the consumed attempt and becomes `edited_invalid`; later answers do not replace it.
5. If the first attempt is late, it becomes `late_invalid`; later attempts remain duplicates.
6. Non-answer discussion comments do not consume the attempt.
7. Replies are ineligible by default.

Manual identity or answer overrides must trigger deterministic recalculation and preserve an audit record.

### Result statuses

Use explicit statuses, including:

```text
valid_correct
valid_incorrect
edited_invalid
duplicate_invalid
late_invalid
malformed_invalid
reply_invalid
identity_review_required
edited_state_review_required
manual_invalid
void_case
```

Do not delete invalid records. Exclude their value in calculations while preserving evidence.

### Provisional scoring

Default:

- correct: 100 points;
- incorrect: 0;
- invalid: 0.

Design the domain model for future streak and season scoring, but do not implement an elaborate public leaderboard unless it is needed for the local MVP. Provide per-case player results and a provisional cumulative local leaderboard across finalised cases.

Finalisation must:

- require a correct answer;
- require the case to be closed;
- warn about unresolved identity/edited-state reviews;
- show a result preview;
- require explicit confirmation;
- run in a database transaction;
- create immutable score events;
- allow an administrator correction workflow that appends reversal/replacement events rather than silently rewriting history.

## Result views

Provide:

- total observed comments;
- top-level comments;
- official answer attempts;
- valid attempts;
- correct and incorrect counts;
- invalid counts grouped by reason;
- A/B/C distribution among valid attempts;
- correct percentage;
- unresolved review count;
- player result table;
- cumulative local leaderboard;
- selected comments with strong reasoning;
- export-ready summary.

Never describe the result as representing all viewers. Label it as results from collected/eligible comments.

## Export and backup

Support:

- CSV export of current comment records;
- JSON export including source evidence and audit fields;
- case-result CSV;
- leaderboard CSV;
- import-run report;
- local database backup;
- database restore with confirmation and validation.

File names must be deterministic and useful, for example:

```text
<collection-slug>__comments__2026-07-05T120000Z.csv
<collection-slug>__case-results__final.csv
```

Exports and backups belong under gitignored runtime directories.

## Security and privacy

- Bind only to `127.0.0.1` by default.
- Validate all URLs and request bodies.
- Escape comment text and never render source HTML as trusted HTML.
- Use secure response headers appropriate for a local app.
- Prevent arbitrary file reads/writes and path traversal.
- Redact comment text, handles, channel IDs, cookies, tokens, and filesystem paths from normal logs.
- Do not persist browser cookies or profiles by default.
- If persistent browser state is ever added, make it opt-in, local, encrypted where practical, and gitignored.
- Provide delete-collection and purge-player-data operations with confirmation.
- Include a privacy/data inventory screen or document.
- Include a retention setting and a purge command.

## Error handling

Implement typed domain errors and clear UI states for:

- invalid URL;
- unsupported host;
- video unavailable;
- comments disabled;
- login/age restriction;
- consent interaction required;
- challenge/CAPTCHA detected;
- provider selectors outdated;
- import timeout;
- operator cancellation;
- database failure;
- duplicate collection;
- incomplete import;
- ambiguous identity;
- export failure.

Never convert a provider error into an apparently successful import with zero comments.

## Testing requirements

### Unit tests

Cover:

- URL parsing;
- collection-name sanitisation;
- answer parsing;
- publication-time ordering;
- author-key precedence;
- duplicate invalidation;
- edited invalidation;
- late invalidation;
- manual overrides;
- score calculation;
- finalisation and reversal events;
- CSV/JSON export escaping.

### Integration tests

Cover:

- clean database migration;
- collection creation;
- repeated fixture imports without duplication;
- changed text between snapshots;
- identity merge/split;
- case recalculation;
- finalisation transaction;
- backup and restore.

### Browser tests

Use deterministic fixtures to test:

- add-video workflow;
- live import progress;
- comments table filters;
- comment evidence drawer;
- quiz configuration;
- review queue;
- finalisation confirmation;
- export workflow.

Do not run live YouTube collection in CI. Live-provider tests must be manual, opt-in, and excluded from normal test commands.

## Documentation to create and maintain

- complete `README.md` with Windows/PowerShell and WSL setup;
- `.env.example`;
- architecture documentation;
- database/data dictionary;
- provider contract documentation;
- temporary provider limitations;
- official API migration guide;
- troubleshooting guide;
- operator workflow;
- privacy/data handling notes;
- `docs/PROGRESS_LOG.md` updated after every phase.

## Git and delivery requirements

- Work in focused phases.
- Use conventional commits.
- Push all completed non-sensitive work to `Zoeruijtje/YT-game`.
- Do not commit generated runtime data.
- Do not rewrite unrelated history.
- Keep the application runnable after each phase.
- Before declaring completion, run formatting, lint, type checking, all non-live tests, a clean migration, and a production build.

## Required implementation phases

### Phase 0 — inspect and plan

- Read repository guidance.
- Inspect git history and current files.
- Record the concrete plan in `docs/PROGRESS_LOG.md`.
- Resolve stack/version choices using current official documentation.

### Phase 1 — workspace foundation

- Create pnpm workspace and app/package skeletons.
- Add lint, format, typecheck, test, build, and dev scripts.
- Add strict `.gitignore`, `.env.example`, and CI.
- Add a basic local dashboard and health endpoint.

### Phase 2 — database and domain

- Implement migrations, repositories, schemas, audit model, import runs, comments, snapshots, quiz configuration, player identities, and score events.
- Add domain unit tests.

### Phase 3 — fixture provider and import UI

- Implement provider contract and deterministic fixture provider.
- Build add-video, collection creation, live progress, collections list, and collection detail.
- Prove repeat imports are idempotent.

### Phase 4 — comment review and scoring

- Implement table, filters, evidence drawer, parser, invalidation rules, identity review, case configuration, result preview, finalisation, and exports.

### Phase 5 — temporary Playwright provider

- Implement the public-page provider within the stated restrictions.
- Add provider diagnostics and resilient failure handling.
- Validate manually on an operator-selected public video without committing data.

### Phase 6 — hardening and documentation

- Add backup/restore, purge operations, retention, audit views, error recovery, accessibility checks, and complete documentation.
- Run all quality gates from a clean checkout.

## Final acceptance test

From a clean clone on Windows or WSL, the documented commands must allow the operator to:

1. install dependencies;
2. migrate a clean local database;
3. start the server and UI;
4. create a collection from a video URL;
5. import deterministic fixture comments;
6. optionally run the temporary visible-browser provider;
7. re-import without duplicates;
8. inspect author, text, timestamps, edited evidence, and source links;
9. configure a deadline and correct answer;
10. see first answers count and duplicate/edited/late entries contribute zero;
11. manually override a record with a preserved audit trail;
12. finalise results and view local cumulative scores;
13. export CSV/JSON;
14. back up and restore the database;
15. run all tests and build successfully.

Do not return only a plan. Implement the application in the repository, verify it, document it, commit it, and push the completed work.
