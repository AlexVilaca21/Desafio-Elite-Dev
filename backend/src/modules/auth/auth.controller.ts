import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UsersService } from 'modules/users/users.service';
import { UserResponseDto } from 'modules/users/dto/user-response.dto';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthUser } from './types/auth-user';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Post('register')
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() authUser: AuthUser): Promise<UserResponseDto> {
    const user = await this.usersService.findByIdOrThrow(authUser.id);
    return this.usersService.toResponse(user);
  }
}
