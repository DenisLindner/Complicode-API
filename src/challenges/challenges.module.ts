import { Module } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { ChallengesController } from './challenges.controller';
import { GenerativeService } from './generative/generative.service';
import { GeminiService } from './generative/gemini.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule],
  providers: [
    ChallengesService,
    {
      provide: GenerativeService,
      useClass: GeminiService,
    },
  ],
  controllers: [ChallengesController],
})
export class ChallengesModule {}
