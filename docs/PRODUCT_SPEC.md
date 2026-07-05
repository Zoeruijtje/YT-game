# Product specification

## Product goal

YT-game is a local operator tool for turning YouTube quiz comments into an auditable case record. It must preserve source evidence, identify each player's earliest official answer, exclude invalid answers from value without deleting them, and produce trustworthy provisional and final results.

## Primary user

One channel operator running the software locally on Windows or WSL.

## Primary workflow

1. Paste a YouTube video URL.
2. Preview video metadata.
3. Create or reuse a persistent collection automatically named from the video title and ID.
4. Run an import using a selected provider.
5. Review collected comments and import warnings.
6. Configure the case choices, close time, answer parser, and correct answer.
7. Resolve identity or metadata ambiguities.
8. Preview classifications and scoring.
9. Finalise the case.
10. Export results and use them to create a result video.

## MVP functional requirements

### Collections

- One persistent collection per video by default.
- Operator-editable name.
- Separate immutable import-run history.
- Re-import without duplicate current records.
- Search, sort, archive, delete, and export.

### Comment evidence

Store all information the active provider reliably exposes, including author references, text, source/permalink identifiers, publication/observation times, edited evidence, likes, reply information, pinned/hearted/owner indicators, and extraction warnings.

Unavailable values must be represented as unknown rather than guessed.

### Review

- Search and server-side pagination.
- Filters for answer, validity, invalid reason, edited state, duplicate state, late state, kind, identity confidence, import run, and date.
- Evidence and snapshot history.
- Manual answer override.
- Manual invalidation and restoration.
- Identity merge/split.
- Operator notes.
- Complete audit history.

### Answer rules

- Configurable choices; initial default A/B/C.
- Top-level comments only by default.
- First parseable official answer per resolved player identity consumes the attempt.
- Later parseable answers are duplicate-invalid.
- If the consumed answer is edited, it is invalid and later answers do not replace it.
- If the consumed answer is late, it is invalid and later answers do not replace it.
- Non-answer discussion does not consume an attempt.
- Unknown identity or edited state can be held for review.

### Results

- Correct, incorrect, and invalid counts.
- Invalid counts by reason.
- Choice distribution.
- Correct percentage among eligible attempts.
- Per-player result.
- Cumulative local score table across finalised cases.
- Immutable score events with corrections represented as reversal/replacement events.

### Export

- Comments CSV and JSON.
- Case results CSV.
- Local leaderboard CSV.
- Import-run summary.
- Database backup and restore.

## Non-functional requirements

- Local only; bind to `127.0.0.1` by default.
- Strict TypeScript.
- SQLite persistence.
- Responsive and keyboard accessible.
- No secrets or runtime source data committed to Git.
- Deterministic scoring.
- Actionable errors.
- Large collections remain usable.
- Clean provider replacement path for the official YouTube Data API.

## Out of scope for the first MVP

- Public hosted leaderboard.
- Multi-user authentication.
- Posting or modifying YouTube comments.
- Automated video upload.
- Monetary prizes.
- Cloud deployment.
- Circumvention of YouTube controls.
- Claiming that browser collection is officially authorised.

## Acceptance criteria

The product is acceptable when the complete workflow can be demonstrated from a clean clone using fixtures, and the optional temporary browser provider can collect from a supported public page or fail clearly without bypass behaviour.
