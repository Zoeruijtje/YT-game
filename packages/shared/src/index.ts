import { z } from 'zod';

export const editedStateSchema = z.enum([
  'edited_confirmed',
  'edited_observed_between_imports',
  'not_marked_edited',
  'unknown',
]);
export type EditedState = z.infer<typeof editedStateSchema>;

export const identityConfidenceSchema = z.enum(['high', 'medium', 'low', 'review_required']);
export type IdentityConfidence = z.infer<typeof identityConfidenceSchema>;

export const commentKindSchema = z.enum(['top_level', 'reply']);
export type CommentKind = z.infer<typeof commentKindSchema>;

export const triStateSchema = z.enum(['true', 'false', 'unknown', 'not_observed']);
export type TriState = z.infer<typeof triStateSchema>;

export const resultStatusSchema = z.enum([
  'valid_correct',
  'valid_incorrect',
  'edited_invalid',
  'duplicate_invalid',
  'late_invalid',
  'malformed_invalid',
  'reply_invalid',
  'identity_review_required',
  'edited_state_review_required',
  'manual_invalid',
  'void_case',
]);
export type ResultStatus = z.infer<typeof resultStatusSchema>;

export const collectorCommentSchema = z.object({
  sourceCommentId: z.string().min(1).nullable(),
  sourceParentCommentId: z.string().min(1).nullable().default(null),
  providerRecordRef: z.string().min(1).nullable().default(null),
  kind: commentKindSchema,
  permalink: z.string().url().nullable(),
  authorDisplayName: z.string().min(1),
  authorHandle: z.string().nullable(),
  authorCanonicalUrl: z.string().url().nullable(),
  authorChannelId: z.string().nullable(),
  providerAuthorRef: z.string().nullable().default(null),
  avatarUrl: z.string().url().nullable(),
  text: z.string(),
  publishedLabel: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
  sourceUpdatedAt: z.string().datetime().nullable(),
  editedState: editedStateSchema,
  editedEvidence: z.array(z.string()).default([]),
  likeCountRaw: z.string().nullable(),
  likeCount: z.number().int().nonnegative().nullable(),
  isHearted: triStateSchema,
  isPinned: triStateSchema,
  isOwner: triStateSchema,
  replyCount: z.number().int().nonnegative().nullable(),
  sourceState: z.string().nullable(),
  extractionWarnings: z.array(z.string()).default([]),
});
export type CollectorComment = z.infer<typeof collectorCommentSchema>;

export const videoInspectionSchema = z.object({
  videoId: z.string(),
  canonicalUrl: z.string().url(),
  title: z.string().nullable(),
  channelName: z.string().nullable(),
  channelRef: z.string().nullable(),
  thumbnailUrl: z.string().url().nullable(),
  publishedLabel: z.string().nullable(),
  publishedAt: z.string().datetime().nullable(),
  commentsDisabled: z.boolean().nullable(),
  warnings: z.array(z.string()).default([]),
});
export type VideoInspection = z.infer<typeof videoInspectionSchema>;

export const importOptionsSchema = z.object({
  includeReplies: z.boolean().default(false),
  maxComments: z.number().int().min(1).max(100_000).default(5000),
  maxRuntimeSeconds: z.number().int().min(10).max(21_600).default(900),
  headless: z.boolean().default(false),
  delayMs: z.number().int().min(250).max(30_000).default(1500),
  fixtureVariant: z.string().default('default'),
});
export type ImportOptions = z.infer<typeof importOptionsSchema>;

export const quizCaseInputSchema = z.object({
  caseNumber: z.string().trim().min(1).max(80),
  question: z.string().trim().min(1).max(500),
  choices: z.array(z.string().trim().min(1).max(20)).min(2).max(20),
  closesAtUtc: z.string().datetime(),
  displayTimezone: z.string().min(1).default('Europe/Amsterdam'),
  correctChoice: z.string().nullable(),
  status: z.enum(['draft', 'open', 'closed', 'reviewed', 'finalised', 'void']),
  repliesEligible: z.boolean().default(false),
  editedPolicy: z.enum(['invalid', 'allow']).default('invalid'),
  unknownEditedPolicy: z.enum(['review_required', 'allow', 'invalid']).default('review_required'),
  latePolicy: z.enum(['invalid', 'allow']).default('invalid'),
  malformedPolicy: z.enum(['invalid', 'ignore']).default('invalid'),
  pointsCorrect: z.number().int().min(-100_000).max(100_000).default(100),
  pointsIncorrect: z.number().int().min(-100_000).max(100_000).default(0),
});
export type QuizCaseInput = z.infer<typeof quizCaseInputSchema>;

export class AppError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: unknown;

  constructor(code: string, message: string, statusCode = 400, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
