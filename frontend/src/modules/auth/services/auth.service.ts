import { http } from '@/shared/api/http';
import type { AuthResponse, AuthUser } from '../types/auth.types';

export function login(payload: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return http<AuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });
}

export function register(payload: {
  name: string;
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return http<AuthResponse>('/auth/register', {
    method: 'POST',
    body: payload,
  });
}

export function getMe(): Promise<AuthUser> {
  return http<AuthUser>('/auth/me');
}
