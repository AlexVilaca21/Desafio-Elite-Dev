import { afterEach, describe, expect, it } from 'vitest';
import {
  clearSession,
  getStoredUser,
  getToken,
  saveSession,
} from './session';

const user = {
  id: 'user-1',
  name: 'Cliente Ana',
  email: 'cliente@elite.dev',
  role: 'CLIENT' as const,
};

describe('session', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('persists the token and the user', () => {
    saveSession('token-abc', user);

    expect(getToken()).toBe('token-abc');
    expect(getStoredUser()).toEqual(user);
  });

  it('clears the stored session', () => {
    saveSession('token-abc', user);
    clearSession();

    expect(getToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it('returns null when the stored user is invalid JSON', () => {
    localStorage.setItem('elite.user', '{broken');
    expect(getStoredUser()).toBeNull();
  });
});
