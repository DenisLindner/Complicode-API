import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { User } from '../generated/prisma/client';
import { UpdateLocaleDTO } from '../i18n/locale.dto';
import { UserService } from './user.service';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UserController {
  constructor(private readonly service: UserService) {}

  @Get('me')
  me(@CurrentUser() user: User) {
    return user;
  }

  /** The language of the emails and bot messages follows the website. */
  @Patch('me/locale')
  async updateLocale(@CurrentUser() user: User, @Body() dto: UpdateLocaleDTO) {
    return await this.service.updateLocale(user.id, dto.locale);
  }
}
