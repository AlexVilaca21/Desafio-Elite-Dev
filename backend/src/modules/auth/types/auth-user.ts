export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'ORGANIZER' | 'CLIENT' | 'GATE';
};
