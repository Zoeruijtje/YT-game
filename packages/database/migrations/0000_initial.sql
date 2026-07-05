PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS video_collections (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  canonical_url TEXT NOT NULL,
  generated_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  title TEXT,
  channel_name TEXT,
  channel_ref TEXT,
  thumbnail_url TEXT,
  archived_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS video_collections_updated_idx ON video_collections(updated_at);

CREATE TABLE IF NOT EXISTS import_runs (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES video_collections(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  requested_options_json TEXT NOT NULL,
  observed_count INTEGER NOT NULL DEFAULT 0,
  unique_count INTEGER NOT NULL DEFAULT 0,
  duplicate_snapshot_count INTEGER NOT NULL DEFAULT 0,
  completeness TEXT NOT NULL DEFAULT 'unknown',
  stop_reason TEXT,
  warning_count INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS import_runs_collection_started_idx ON import_runs(collection_id, started_at);

CREATE TABLE IF NOT EXISTS player_identities (
  id TEXT PRIMARY KEY,
  canonical_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS player_identity_links (
  id TEXT PRIMARY KEY,
  player_identity_id TEXT NOT NULL REFERENCES player_identities(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL,
  source_value TEXT NOT NULL,
  confidence TEXT NOT NULL,
  is_manual INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  UNIQUE(source_type, source_value)
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL REFERENCES video_collections(id) ON DELETE CASCADE,
  player_identity_id TEXT REFERENCES player_identities(id) ON DELETE SET NULL,
  provider_id TEXT NOT NULL,
  source_comment_id TEXT,
  source_parent_comment_id TEXT,
  provider_record_ref TEXT,
  kind TEXT NOT NULL,
  permalink TEXT,
  author_display_name TEXT NOT NULL,
  author_handle TEXT,
  author_canonical_url TEXT,
  author_channel_id TEXT,
  derived_author_key TEXT NOT NULL,
  derived_author_source TEXT NOT NULL,
  identity_confidence TEXT NOT NULL,
  avatar_url TEXT,
  current_text TEXT NOT NULL,
  first_seen_text TEXT NOT NULL,
  normalised_text TEXT NOT NULL,
  published_label TEXT,
  published_at TEXT,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  source_updated_at TEXT,
  edited_state TEXT NOT NULL,
  edited_evidence_json TEXT NOT NULL,
  like_count_raw TEXT,
  like_count INTEGER,
  is_hearted TEXT NOT NULL,
  is_pinned TEXT NOT NULL,
  is_owner TEXT NOT NULL,
  reply_count INTEGER,
  source_state TEXT,
  content_hash TEXT NOT NULL,
  extraction_warnings_json TEXT NOT NULL,
  manually_invalid_reason TEXT,
  manual_answer_override TEXT,
  operator_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(collection_id, provider_id, source_comment_id)
);
CREATE INDEX IF NOT EXISTS comments_collection_idx ON comments(collection_id);
CREATE INDEX IF NOT EXISTS comments_player_idx ON comments(player_identity_id);
CREATE INDEX IF NOT EXISTS comments_first_seen_idx ON comments(first_seen_at);

CREATE TABLE IF NOT EXISTS comment_snapshots (
  id TEXT PRIMARY KEY,
  comment_record_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  import_run_id TEXT NOT NULL REFERENCES import_runs(id) ON DELETE CASCADE,
  observed_at TEXT NOT NULL,
  text TEXT NOT NULL,
  extracted_evidence_json TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  UNIQUE(import_run_id, comment_record_id)
);
CREATE INDEX IF NOT EXISTS comment_snapshots_comment_idx ON comment_snapshots(comment_record_id, observed_at);

CREATE TABLE IF NOT EXISTS quiz_cases (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL UNIQUE REFERENCES video_collections(id) ON DELETE CASCADE,
  case_number TEXT NOT NULL,
  question TEXT NOT NULL,
  choices_json TEXT NOT NULL,
  closes_at_utc TEXT NOT NULL,
  display_timezone TEXT NOT NULL,
  correct_choice TEXT,
  status TEXT NOT NULL,
  rules_json TEXT NOT NULL,
  scoring_json TEXT NOT NULL,
  finalised_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS manual_overrides (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  override_type TEXT NOT NULL,
  previous_value_json TEXT,
  new_value_json TEXT,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS manual_overrides_target_idx ON manual_overrides(target_type, target_id);

CREATE TABLE IF NOT EXISTS score_events (
  id TEXT PRIMARY KEY,
  player_identity_id TEXT NOT NULL REFERENCES player_identities(id) ON DELETE CASCADE,
  quiz_case_id TEXT NOT NULL REFERENCES quiz_cases(id) ON DELETE CASCADE,
  comment_id TEXT REFERENCES comments(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  replaces_event_id TEXT,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS score_events_player_idx ON score_events(player_identity_id);
CREATE INDEX IF NOT EXISTS score_events_case_idx ON score_events(quiz_case_id);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS audit_events_target_idx ON audit_events(target_type, target_id, created_at);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS collection_tag_links (
  collection_id TEXT NOT NULL REFERENCES video_collections(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  PRIMARY KEY(collection_id, tag)
);
