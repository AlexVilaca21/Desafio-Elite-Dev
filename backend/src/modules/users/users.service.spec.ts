import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'modules/prisma/prisma.service';
import { UsersService } from './users.service';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;

  const user = {
    findUnique: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    user.findUnique.mockReset();
    user.create.mockReset();
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: { user },
        },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  it('should create a client account', async () => {
    user.findUnique.mockResolvedValue(null);
    user.create.mockResolvedValue({
      id: 'user-1',
      name: 'Ana',
      email: 'ana@elite.dev',
      role: Role.CLIENT,
    });

    const created = await service.createClient(
      'Ana',
      'Ana@elite.dev',
      'senha123',
    );

    expect(user.create).toHaveBeenCalledWith({
      data: {
        name: 'Ana',
        email: 'ana@elite.dev',
        passwordHash: 'hashed',
        role: Role.CLIENT,
      },
    });
    expect(created.email).toBe('ana@elite.dev');
  });

  it('should reject duplicated email', async () => {
    user.findUnique.mockResolvedValue({ id: 'user-1' });

    await expect(
      service.createClient('Ana', 'ana@elite.dev', 'senha123'),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw when user is missing', async () => {
    user.findUnique.mockResolvedValue(null);

    await expect(service.findByIdOrThrow('missing')).rejects.toThrow(
      NotFoundException,
    );
  });
});
