import * as bcrypt from 'bcrypt';
import { HashingService } from './hashing.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BcryptService extends HashingService {
  async hash(data: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(data, saltRounds);
  }

  async compare(data: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(data, hashed);
  }
}
