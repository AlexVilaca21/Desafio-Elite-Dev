import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from 'modules/users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthUser } from './types/auth-user';

type JwtPayload = {
  sub: string;
  email: string;
  role: AuthUser['role'];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('E-mail ou senha inválidos');
    }

    return this.buildAuthResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const user = await this.usersService.createClient(
      dto.name,
      dto.email,
      dto.password,
    );

    return this.buildAuthResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  }

  private buildAuthResponse(user: AuthUser): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
