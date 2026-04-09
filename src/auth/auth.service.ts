import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HashingService } from './hashing/hashing.service';
import { UsersService } from 'src/users/users.service';
import { CreateUserDTO } from 'src/users/dto/create-user.dto';
import { Role } from 'src/generated/prisma/enums';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: CreateUserDTO): Promise<{ accessToken: string }> {
    const existingUserWithEmail = await this.usersService.findByEmail(
      dto.email,
    );
    if (existingUserWithEmail) {
      throw new ConflictException('User already exists');
    }

    const existingUserWithUsername = await this.usersService.findByUsername(
      dto.username,
    );
    if (existingUserWithUsername) {
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await this.hashingService.hash(dto.password);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });

    const accessToken = await this.generateToken(
      user.id,
      user.email,
      user.role,
    );
    return { accessToken };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await this.hashingService.compare(
      dto.password,
      user.password,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.generateToken(
      user.id,
      user.email,
      user.role,
    );
    return { accessToken };
  }

  private async generateToken(id: string, email: string, role: Role) {
    const payload = { id, email, role };
    return this.jwtService.signAsync(payload);
  }
}
