import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'modules/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'modules/auth/guards/jwt-auth.guard';
import { AuthUser } from 'modules/auth/types/auth-user';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() authUser: AuthUser): Promise<UserResponseDto> {
    const user = await this.usersService.findByIdOrThrow(authUser.id);
    return this.usersService.toResponse(user);
  }
}
