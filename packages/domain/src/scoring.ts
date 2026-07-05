import type { EditedState, IdentityConfidence, ResultStatus } from '@yt-game/shared';
import { parseOfficialAnswer } from './parser.js';

export interface ScoringComment {
  id: string;
  playerIdentityId: string | null;
  identityConfidence: IdentityConfidence;
  kind: 'top_level' | 'reply';
  text: string;
  publishedAt: string | null;
  firstSeenAt: string;
  editedState: EditedState;
  manualInvalidReason: string | null;
  manualAnswerOverride: string | null;
}

export interface ScoringCase {
  choices: string[];
  closesAtUtc: string;
  correctChoice: string | null;
  status: 'draft' | 'open' | 'closed' | 'reviewed' | 'finalised' | 'void';
  repliesEligible: boolean;
  editedPolicy: 'invalid' | 'allow';
  unknownEditedPolicy: 'review_required' | 'allow' | 'invalid';
  latePolicy: 'invalid' | 'allow';
  malformedPolicy: 'invalid' | 'ignore';
  pointsCorrect: number;
  pointsIncorrect: number;
}

export interface AttemptProjection {
  commentId: string;
  playerIdentityId: string | null;
  parsedChoice: string | null;
  parserReason: string;
  consumesAttempt: boolean;
  status: ResultStatus;
  reason: string;
  points: number;
  orderingTime: string;
}

export interface CaseSummary {
  totalObserved: number;
  topLevelComments: number;
  officialAttempts: number;
  validAttempts: number;
  correct: number;
  incorrect: number;
  unresolvedReviews: number;
  invalidByReason: Record<string, number>;
  choiceDistribution: Record<string, number>;
  correctPercentage: number | null;
}

export function calculateCase(comments: ScoringComment[], quiz: ScoringCase): { projections: AttemptProjection[]; summary: CaseSummary } {
  const parsed = comments.map((comment) => {
    const result = comment.manualAnswerOverride
      ? { choice: comment.manualAnswerOverride, isOfficial: true, reason: 'manual_answer_override', normalisedText: comment.text }
      : parseOfficialAnswer(comment.text, quiz.choices);
    return { comment, result, orderingTime: comment.publishedAt ?? comment.firstSeenAt };
  });

  const officialEligibleKind = parsed.filter(({ comment, result }) => result.isOfficial && (quiz.repliesEligible || comment.kind === 'top_level'));
  const groups = new Map<string, typeof officialEligibleKind>();
  for (const item of officialEligibleKind) {
    const key = item.comment.playerIdentityId ?? `unresolved:${item.comment.id}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  for (const list of groups.values()) list.sort(compareAttempts);

  const firstByComment = new Set<string>();
  const duplicateByComment = new Set<string>();
  for (const list of groups.values()) {
    if (list[0]) firstByComment.add(list[0].comment.id);
    for (const duplicate of list.slice(1)) duplicateByComment.add(duplicate.comment.id);
  }

  const projections = parsed.map(({ comment, result, orderingTime }): AttemptProjection => {
    if (quiz.status === 'void') return projection(comment, result.choice, result.reason, false, 'void_case', 'case_void', 0, orderingTime);
    if (comment.kind === 'reply' && !quiz.repliesEligible) return projection(comment, result.choice, result.reason, false, 'reply_invalid', 'replies_not_eligible', 0, orderingTime);
    if (!result.isOfficial) {
      return projection(comment, null, result.reason, false, 'malformed_invalid', result.reason, 0, orderingTime);
    }
    if (duplicateByComment.has(comment.id)) return projection(comment, result.choice, result.reason, false, 'duplicate_invalid', 'later_parseable_answer', 0, orderingTime);
    const consumesAttempt = firstByComment.has(comment.id);
    if (comment.manualInvalidReason) return projection(comment, result.choice, result.reason, consumesAttempt, 'manual_invalid', comment.manualInvalidReason, 0, orderingTime);
    if (!comment.playerIdentityId || comment.identityConfidence === 'review_required') return projection(comment, result.choice, result.reason, consumesAttempt, 'identity_review_required', 'identity_requires_review', 0, orderingTime);
    if (quiz.editedPolicy === 'invalid' && ['edited_confirmed', 'edited_observed_between_imports'].includes(comment.editedState)) {
      return projection(comment, result.choice, result.reason, consumesAttempt, 'edited_invalid', comment.editedState, 0, orderingTime);
    }
    if (comment.editedState === 'unknown') {
      if (quiz.unknownEditedPolicy === 'review_required') return projection(comment, result.choice, result.reason, consumesAttempt, 'edited_state_review_required', 'edited_state_unknown', 0, orderingTime);
      if (quiz.unknownEditedPolicy === 'invalid') return projection(comment, result.choice, result.reason, consumesAttempt, 'edited_invalid', 'edited_state_unknown', 0, orderingTime);
    }
    if (quiz.latePolicy === 'invalid' && new Date(orderingTime).getTime() > new Date(quiz.closesAtUtc).getTime()) {
      return projection(comment, result.choice, result.reason, consumesAttempt, 'late_invalid', 'after_close_time', 0, orderingTime);
    }
    const isCorrect = quiz.correctChoice !== null && result.choice === quiz.correctChoice;
    return projection(
      comment,
      result.choice,
      result.reason,
      consumesAttempt,
      isCorrect ? 'valid_correct' : 'valid_incorrect',
      quiz.correctChoice === null ? 'correct_answer_not_set' : isCorrect ? 'matches_correct_choice' : 'does_not_match_correct_choice',
      isCorrect ? quiz.pointsCorrect : quiz.pointsIncorrect,
      orderingTime,
    );
  });

  return { projections, summary: summarise(comments, quiz, projections) };
}

function compareAttempts(a: { comment: ScoringComment; orderingTime: string }, b: { comment: ScoringComment; orderingTime: string }): number {
  return a.orderingTime.localeCompare(b.orderingTime) || a.comment.firstSeenAt.localeCompare(b.comment.firstSeenAt) || a.comment.id.localeCompare(b.comment.id);
}

function projection(
  comment: ScoringComment,
  parsedChoice: string | null,
  parserReason: string,
  consumesAttempt: boolean,
  status: ResultStatus,
  reason: string,
  points: number,
  orderingTime: string,
): AttemptProjection {
  return { commentId: comment.id, playerIdentityId: comment.playerIdentityId, parsedChoice, parserReason, consumesAttempt, status, reason, points, orderingTime };
}

function summarise(comments: ScoringComment[], quiz: ScoringCase, projections: AttemptProjection[]): CaseSummary {
  const valid = projections.filter((entry) => entry.status === 'valid_correct' || entry.status === 'valid_incorrect');
  const correct = valid.filter((entry) => entry.status === 'valid_correct').length;
  const invalidByReason: Record<string, number> = {};
  const choiceDistribution = Object.fromEntries(quiz.choices.map((choice) => [choice, 0]));
  for (const entry of projections) {
    if (entry.status.endsWith('_invalid') || entry.status.endsWith('_required')) invalidByReason[entry.status] = (invalidByReason[entry.status] ?? 0) + 1;
    if ((entry.status === 'valid_correct' || entry.status === 'valid_incorrect') && entry.parsedChoice) choiceDistribution[entry.parsedChoice] = (choiceDistribution[entry.parsedChoice] ?? 0) + 1;
  }
  return {
    totalObserved: comments.length,
    topLevelComments: comments.filter((comment) => comment.kind === 'top_level').length,
    officialAttempts: projections.filter((entry) => entry.consumesAttempt).length,
    validAttempts: valid.length,
    correct,
    incorrect: valid.length - correct,
    unresolvedReviews: projections.filter((entry) => entry.status.endsWith('_review_required')).length,
    invalidByReason,
    choiceDistribution,
    correctPercentage: valid.length ? (correct / valid.length) * 100 : null,
  };
}
