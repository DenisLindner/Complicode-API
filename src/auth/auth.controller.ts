import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDTO } from 'src/users/dto/create-user.dto';
import { IsPublic } from './decorators/is-public.decorator';

@Controller('auth')
@IsPublic()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: CreateUserDTO): Promise<{ accessToken: string }> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto): Promise<{ accessToken: string }> {
    return this.authService.login(dto);
  }
}
