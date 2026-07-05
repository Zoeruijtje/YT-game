# Architecture specification

## Overview

YT-game is a local full-stack TypeScript application. The browser UI communicates only with a server bound to localhost. The server owns the database, collector jobs, scoring, exports, and audit log.

## Proposed workspace

```text
apps/web       React/Vite operator UI
apps/server    Fastify local API and job coordinator
packages/domain      parsing, validity, scoring, shared types
packages/database    SQLite schema, migrations, repositories
packages/collectors  provider contracts and implementations
packages/shared      boundary schemas and utilities
fixtures             deterministic non-personal test data
scripts              setup, backup, restore, maintenance
```

## Main modules

### Collection service

Owns video collections, generated naming, metadata, lifecycle, and import-run history.

### Collector service

Runs a provider through a stable contract, streams progress, validates extracted records, and persists source snapshots incrementally.

Providers:

- `fixture`;
- `public-page-playwright` temporary provider;
- future `youtube-data-api` provider.

### Comment evidence service

Maintains current comment records and immutable snapshots. It never destroys first-seen source evidence. Provider-specific uncertainty is explicit.

### Identity resolution service

Builds a player identity from the strongest available author reference and records confidence. Supports manual merge and split overrides without rewriting source records.

### Quiz engine

Parses official answers, orders attempts, assigns automatic statuses, applies manual overrides, and produces a deterministic case projection.

### Score ledger

Creates immutable point events only when a case is finalised. Corrections append reversal and replacement events.

### Export service

Generates escaped CSV and structured JSON from database queries. Writes only to controlled gitignored directories.

### Audit service

Records manual overrides, identity changes, finalisation, corrections, imports, exports, deletes, and restores.

## Data model outline

### VideoCollection

- id
- videoId
- canonicalUrl
- generatedName
- displayName
- title
- channelName
- channelRef
- thumbnailUrl
- archivedAt
- createdAt
- updatedAt

### ImportRun

- id
- collectionId
- providerId
- status
- startedAt
- finishedAt
- requestedOptionsJson
- observedCount
- uniqueCount
- completeness
- stopReason
- warningCount
- errorCode

### CommentRecord

- id
- collectionId
- providerId
- sourceCommentId
- sourceParentCommentId
- kind
- permalink
- authorDisplayName
- authorHandle
- authorCanonicalUrl
- authorChannelId
- derivedAuthorKey
- identityConfidence
- firstSeenAt
- lastSeenAt
- currentText
- firstSeenText
- publishedLabel
- publishedAt
- sourceUpdatedAt
- editedState
- likeCountRaw
- likeCount
- isPinned
- isHearted
- isOwner
- replyCount
- sourceState
- contentHash
- extractionWarningsJson

### CommentSnapshot

- id
- commentRecordId
- importRunId
- observedAt
- text
- extractedEvidenceJson
- contentHash

### PlayerIdentity

- id
- canonicalKey
- displayName
- status
- createdAt

### PlayerIdentityLink

- id
- playerIdentityId
- sourceType
- sourceValue
- confidence
- isManual

### QuizCase

- id
- collectionId
- caseNumber
- question
- choicesJson
- closesAtUtc
- displayTimezone
- correctChoice
- status
- rulesJson
- scoringJson

### AttemptProjection

This may be computed or cached. It records the current deterministic interpretation of a comment as an answer attempt, including parsed choice, ordering, status, reason, and points preview.

### ManualOverride

- id
- targetType
- targetId
- overrideType
- previousValueJson
- newValueJson
- reason
- createdAt

### ScoreEvent

- id
- playerIdentityId
- quizCaseId
- eventType
- points
- replacesEventId
- createdAt

### AuditEvent

- id
- actor
- action
- targetType
- targetId
- detailsJson
- createdAt

## Import identity strategy

Comment identity precedence:

1. source comment ID;
2. comment permalink token;
3. provider-stable record reference;
4. fallback fingerprint marked low-confidence.

Author identity precedence:

1. explicit channel ID;
2. canonical channel URL;
3. canonical handle URL;
4. provider author reference;
5. low-confidence fallback.

No display name alone may be treated as unique.

## Deterministic attempt calculation

1. Resolve candidate player identity.
2. Parse comment text using case choices and configured grammar.
3. Reject replies when ineligible.
4. Order parseable comments by reliable published time, first seen time, and stable record ID.
5. Mark the first parseable comment as the consumed attempt.
6. Mark later parseable comments as duplicate-invalid.
7. Apply edited, deadline, identity-review, and manual rules to the consumed attempt.
8. Compare eligible choice with the correct choice.
9. Produce a reason trace for the UI.

## Local security model

- Listen on `127.0.0.1` only.
- No remote authentication in MVP.
- Restrict file operations to configured runtime directories.
- Validate every API payload.
- Escape all user-supplied strings.
- Redact personal/source data in logs.
- Store no persistent browser session by default.

## Upgrade path to the official API

The future provider maps API comment resources into the same normalised comment schema. It may improve:

- stable comment IDs;
- author channel IDs;
- published timestamps;
- updated timestamps;
- pagination completeness;
- moderation-state access when authorised.

No domain rule may depend on Playwright DOM details.
