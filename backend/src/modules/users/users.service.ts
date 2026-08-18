import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'modules/prisma/prisma.service';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createClient(
    name: string,
    email: string,
    password: string,
  ): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new ConflictException('Já existe uma conta com este e-mail');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: Role.CLIENT,
      },
    });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdOrThrow(id: string): Promise<User> {
    const user = await this.findById(id);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
