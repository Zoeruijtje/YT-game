export interface ParseResult {
  choice: string | null;
  isOfficial: boolean;
  reason: string;
  normalisedText: string;
}

export function normaliseCommentText(text: string): string {
  return text.normalize('NFKC').replace(/\s+/g, ' ').trim();
}

export function parseOfficialAnswer(text: string, choices: string[]): ParseResult {
  const normalisedText = normaliseCommentText(text);
  if (!normalisedText) return { choice: null, isOfficial: false, reason: 'empty_comment', normalisedText };
  const escaped = choices
    .map((choice) => choice.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map((choice) => escapeRegex(choice));
  const group = escaped.join('|');
  const patterns = [
    new RegExp(`^(?:answer|antwoord)\\s*[:=-]\\s*(${group})(?=$|[\\s.,;:!?)\\]\\-–—])`, 'i'),
    new RegExp(`^(${group})(?=$|[\\s.,;:!?)\\]\\-–—])`, 'i'),
  ];
  for (const pattern of patterns) {
    const match = normalisedText.match(pattern);
    if (!match?.[1]) continue;
    const choice = choices.find((candidate) => candidate.toLowerCase() === match[1]?.toLowerCase()) ?? match[1];
    const after = normalisedText.slice(match[0].length).trim();
    if (new RegExp(`^(?:or|of)\\s+(?:${group})(?=$|\\W)`, 'i').test(after)) {
      return { choice: null, isOfficial: false, reason: 'ambiguous_multiple_choices', normalisedText };
    }
    return { choice, isOfficial: true, reason: 'leading_allowed_choice', normalisedText };
  }
  return { choice: null, isOfficial: false, reason: 'no_unambiguous_leading_choice', normalisedText };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
