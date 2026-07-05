import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const videoCollections = sqliteTable(
  'video_collections',
  {
    id: text('id').primaryKey(),
    videoId: text('video_id').notNull(),
    canonicalUrl: text('canonical_url').notNull(),
    generatedName: text('generated_name').notNull(),
    displayName: text('display_name').notNull(),
    title: text('title'),
    channelName: text('channel_name'),
    channelRef: text('channel_ref'),
    thumbnailUrl: text('thumbnail_url'),
    archivedAt: text('archived_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [uniqueIndex('video_collections_video_id_unique').on(table.videoId), index('video_collections_updated_idx').on(table.updatedAt)],
);

export const importRuns = sqliteTable(
  'import_runs',
  {
    id: text('id').primaryKey(),
    collectionId: text('collection_id').notNull().references(() => videoCollections.id, { onDelete: 'cascade' }),
    providerId: text('provider_id').notNull(),
    status: text('status').notNull(),
    startedAt: text('started_at').notNull(),
    finishedAt: text('finished_at'),
    requestedOptionsJson: text('requested_options_json').notNull(),
    observedCount: integer('observed_count').notNull().default(0),
    uniqueCount: integer('unique_count').notNull().default(0),
    duplicateSnapshotCount: integer('duplicate_snapshot_count').notNull().default(0),
    completeness: text('completeness').notNull().default('unknown'),
    stopReason: text('stop_reason'),
    warningCount: integer('warning_count').notNull().default(0),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
  },
  (table) => [index('import_runs_collection_started_idx').on(table.collectionId, table.startedAt)],
);

export const playerIdentities = sqliteTable(
  'player_identities',
  {
    id: text('id').primaryKey(),
    canonicalKey: text('canonical_key').notNull(),
    displayName: text('display_name').notNull(),
    status: text('status').notNull().default('active'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [uniqueIndex('player_identities_canonical_unique').on(table.canonicalKey)],
);

export const playerIdentityLinks = sqliteTable(
  'player_identity_links',
  {
    id: text('id').primaryKey(),
    playerIdentityId: text('player_identity_id').notNull().references(() => playerIdentities.id, { onDelete: 'cascade' }),
    sourceType: text('source_type').notNull(),
    sourceValue: text('source_value').notNull(),
    confidence: text('confidence').notNull(),
    isManual: integer('is_manual', { mode: 'boolean' }).notNull().default(false),
    createdAt: text('created_at').notNull(),
  },
  (table) => [uniqueIndex('identity_links_source_unique').on(table.sourceType, table.sourceValue)],
);

export const comments = sqliteTable(
  'comments',
  {
    id: text('id').primaryKey(),
    collectionId: text('collection_id').notNull().references(() => videoCollections.id, { onDelete: 'cascade' }),
    playerIdentityId: text('player_identity_id').references(() => playerIdentities.id, { onDelete: 'set null' }),
    providerId: text('provider_id').notNull(),
    sourceCommentId: text('source_comment_id'),
    sourceParentCommentId: text('source_parent_comment_id'),
    providerRecordRef: text('provider_record_ref'),
    kind: text('kind').notNull(),
    permalink: text('permalink'),
    authorDisplayName: text('author_display_name').notNull(),
    authorHandle: text('author_handle'),
    authorCanonicalUrl: text('author_canonical_url'),
    authorChannelId: text('author_channel_id'),
    derivedAuthorKey: text('derived_author_key').notNull(),
    derivedAuthorSource: text('derived_author_source').notNull(),
    identityConfidence: text('identity_confidence').notNull(),
    avatarUrl: text('avatar_url'),
    currentText: text('current_text').notNull(),
    firstSeenText: text('first_seen_text').notNull(),
    normalisedText: text('normalised_text').notNull(),
    publishedLabel: text('published_label'),
    publishedAt: text('published_at'),
    firstSeenAt: text('first_seen_at').notNull(),
    lastSeenAt: text('last_seen_at').notNull(),
    sourceUpdatedAt: text('source_updated_at'),
    editedState: text('edited_state').notNull(),
    editedEvidenceJson: text('edited_evidence_json').notNull(),
    likeCountRaw: text('like_count_raw'),
    likeCount: integer('like_count'),
    isHearted: text('is_hearted').notNull(),
    isPinned: text('is_pinned').notNull(),
    isOwner: text('is_owner').notNull(),
    replyCount: integer('reply_count'),
    sourceState: text('source_state'),
    contentHash: text('content_hash').notNull(),
    extractionWarningsJson: text('extraction_warnings_json').notNull(),
    manuallyInvalidReason: text('manually_invalid_reason'),
    manualAnswerOverride: text('manual_answer_override'),
    operatorNote: text('operator_note'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('comments_collection_idx').on(table.collectionId),
    index('comments_player_idx').on(table.playerIdentityId),
    uniqueIndex('comments_provider_source_unique').on(table.collectionId, table.providerId, table.sourceCommentId),
    index('comments_first_seen_idx').on(table.firstSeenAt),
  ],
);

export const commentSnapshots = sqliteTable(
  'comment_snapshots',
  {
    id: text('id').primaryKey(),
    commentRecordId: text('comment_record_id').notNull().references(() => comments.id, { onDelete: 'cascade' }),
    importRunId: text('import_run_id').notNull().references(() => importRuns.id, { onDelete: 'cascade' }),
    observedAt: text('observed_at').notNull(),
    text: text('text').notNull(),
    extractedEvidenceJson: text('extracted_evidence_json').notNull(),
    contentHash: text('content_hash').notNull(),
  },
  (table) => [
    uniqueIndex('comment_snapshots_run_comment_unique').on(table.importRunId, table.commentRecordId),
    index('comment_snapshots_comment_idx').on(table.commentRecordId, table.observedAt),
  ],
);

export const quizCases = sqliteTable(
  'quiz_cases',
  {
    id: text('id').primaryKey(),
    collectionId: text('collection_id').notNull().references(() => videoCollections.id, { onDelete: 'cascade' }),
    caseNumber: text('case_number').notNull(),
    question: text('question').notNull(),
    choicesJson: text('choices_json').notNull(),
    closesAtUtc: text('closes_at_utc').notNull(),
    displayTimezone: text('display_timezone').notNull(),
    correctChoice: text('correct_choice'),
    status: text('status').notNull(),
    rulesJson: text('rules_json').notNull(),
    scoringJson: text('scoring_json').notNull(),
    finalisedAt: text('finalised_at'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [uniqueIndex('quiz_cases_collection_unique').on(table.collectionId)],
);

export const manualOverrides = sqliteTable(
  'manual_overrides',
  {
    id: text('id').primaryKey(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    overrideType: text('override_type').notNull(),
    previousValueJson: text('previous_value_json'),
    newValueJson: text('new_value_json'),
    reason: text('reason').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('manual_overrides_target_idx').on(table.targetType, table.targetId)],
);

export const scoreEvents = sqliteTable(
  'score_events',
  {
    id: text('id').primaryKey(),
    playerIdentityId: text('player_identity_id').notNull().references(() => playerIdentities.id, { onDelete: 'cascade' }),
    quizCaseId: text('quiz_case_id').notNull().references(() => quizCases.id, { onDelete: 'cascade' }),
    commentId: text('comment_id').references(() => comments.id, { onDelete: 'set null' }),
    eventType: text('event_type').notNull(),
    points: integer('points').notNull(),
    replacesEventId: text('replaces_event_id'),
    detailsJson: text('details_json').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('score_events_player_idx').on(table.playerIdentityId), index('score_events_case_idx').on(table.quizCaseId)],
);

export const auditEvents = sqliteTable(
  'audit_events',
  {
    id: text('id').primaryKey(),
    actor: text('actor').notNull(),
    action: text('action').notNull(),
    targetType: text('target_type').notNull(),
    targetId: text('target_id').notNull(),
    detailsJson: text('details_json').notNull(),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('audit_events_target_idx').on(table.targetType, table.targetId, table.createdAt)],
);

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  valueJson: text('value_json').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const migrationJournal = sqliteTable('_yt_game_migrations', {
  name: text('name').primaryKey(),
  appliedAt: text('applied_at').notNull(),
});

export const collectionTagLinks = sqliteTable(
  'collection_tag_links',
  {
    collectionId: text('collection_id').notNull().references(() => videoCollections.id, { onDelete: 'cascade' }),
    tag: text('tag').notNull(),
  },
  (table) => [primaryKey({ columns: [table.collectionId, table.tag] })],
);
