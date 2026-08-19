import { describe, expect, it } from 'vitest';
import { mediaUrl } from './media';

describe('mediaUrl', () => {
  it('returns undefined without a path', () => {
    expect(mediaUrl()).toBeUndefined();
  });

  it('keeps an absolute URL', () => {
    expect(mediaUrl('https://cdn.example/banner.jpg')).toBe(
      'https://cdn.example/banner.jpg',
    );
  });

  it('prefixes a local banner with the API origin', () => {
    expect(mediaUrl('/uploads/banners/noite.jpg')).toBe(
      'http://localhost:3000/uploads/banners/noite.jpg',
    );
  });
});
