import { AppError } from '@yt-game/shared';

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const ALLOWED_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be']);

export interface NormalisedVideoUrl {
  videoId: string;
  canonicalUrl: string;
}

export function parseYouTubeUrl(input: string): NormalisedVideoUrl {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw new AppError('invalid_url', 'Enter a complete YouTube URL.', 400);
  }

  const hostname = url.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(hostname)) {
    throw new AppError('unsupported_host', 'Only public youtube.com and youtu.be URLs are supported.', 400);
  }

  let videoId: string | null = null;
  if (hostname === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (url.pathname === '/watch') {
    videoId = url.searchParams.get('v');
  } else {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live') videoId = parts[1] ?? null;
  }

  if (!videoId || !VIDEO_ID_PATTERN.test(videoId)) {
    throw new AppError('invalid_video_id', 'The URL does not contain a valid 11-character YouTube video ID.', 400);
  }

  return { videoId, canonicalUrl: `https://www.youtube.com/watch?v=${videoId}` };
}

export function sanitiseCollectionName(title: string | null, videoId: string): string {
  const clean = (title ?? '')
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
  return clean ? `${clean} [${videoId}]` : `YouTube video ${videoId}`;
}
