import { env } from '@/shared/config/env';

export function mediaUrl(path?: string): string | undefined {
  if (!path) {
    return undefined;
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (env.apiUrl.startsWith('http')) {
    return `${new URL(env.apiUrl).origin}${path}`;
  }

  return path;
}
