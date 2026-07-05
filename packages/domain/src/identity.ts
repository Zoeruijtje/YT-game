import { createHash } from 'node:crypto';
import type { IdentityConfidence } from '@yt-game/shared';

export interface AuthorEvidence {
  authorChannelId: string | null;
  authorCanonicalUrl: string | null;
  authorHandle: string | null;
  providerAuthorRef: string | null;
  authorDisplayName: string;
  avatarUrl?: string | null;
}

export interface DerivedIdentity {
  key: string;
  source: 'channel_id' | 'canonical_url' | 'handle' | 'provider_ref' | 'fallback';
  confidence: IdentityConfidence;
}

export function deriveAuthorIdentity(input: AuthorEvidence): DerivedIdentity {
  if (input.authorChannelId) return { key: `channel:${input.authorChannelId}`, source: 'channel_id', confidence: 'high' };
  if (input.authorCanonicalUrl) return { key: `url:${normaliseUrl(input.authorCanonicalUrl)}`, source: 'canonical_url', confidence: 'high' };
  if (input.authorHandle) return { key: `handle:${input.authorHandle.toLowerCase()}`, source: 'handle', confidence: 'medium' };
  if (input.providerAuthorRef) return { key: `provider:${input.providerAuthorRef}`, source: 'provider_ref', confidence: 'medium' };
  const fallback = createHash('sha256')
    .update(`${input.authorDisplayName.normalize('NFKC').toLowerCase()}|${input.avatarUrl ?? ''}`)
    .digest('hex')
    .slice(0, 24);
  return { key: `fallback:${fallback}`, source: 'fallback', confidence: 'review_required' };
}

function normaliseUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/$/, '').toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}
