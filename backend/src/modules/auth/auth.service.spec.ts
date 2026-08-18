import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UsersService } from 'modules/users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    findByEmail: jest.fn(),
    createClient: jest.fn(),
  };
  const jwtService = {
    sign: jest.fn().mockReturnValue('token'),
  };

  const client = {
    id: 'user-1',
    name: 'Ana',
    email: 'cliente@elite.dev',
    passwordHash: 'hash',
    role: Role.CLIENT,
  };

  beforeEach(async () => {
    usersService.findByEmail.mockReset();
    usersService.createClient.mockReset();
    jwtService.sign.mockClear();
    (bcrypt.compare as jest.Mock).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('should login with valid credentials', async () => {
    usersService.findByEmail.mockResolvedValue(client);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: 'cliente@elite.dev',
      password: 'senha123',
    });

    expect(result.accessToken).toBe('token');
    expect(result.user.role).toBe(Role.CLIENT);
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('should reject invalid password', async () => {
    usersService.findByEmail.mockResolvedValue(client);
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({
        email: 'cliente@elite.dev',
        password: 'errada',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should register a client and return a token', async () => {
    usersService.createClient.mockResolvedValue(client);

    const result = await service.register({
      name: 'Ana',
      email: 'cliente@elite.dev',
      password: 'senha123',
    });

    expect(usersService.createClient).toHaveBeenCalledWith(
      'Ana',
      'cliente@elite.dev',
      'senha123',
    );
    expect(result.accessToken).toBe('token');
  });
});
