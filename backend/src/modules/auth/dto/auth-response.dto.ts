import { AuthUser } from '../types/auth-user';

export class AuthResponseDto {
  accessToken: string;
  user: AuthUser;
}
