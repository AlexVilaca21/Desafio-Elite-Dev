export type Role = 'ORGANIZER' | 'CLIENT' | 'GATE';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export const ROLE_LABELS: Record<Role, string> = {
  ORGANIZER: 'Organizador',
  CLIENT: 'Cliente',
  GATE: 'Portaria',
};
