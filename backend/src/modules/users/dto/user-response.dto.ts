import { Role } from '@prisma/client';

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
}
