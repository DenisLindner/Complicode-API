import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { CatalogModule } from '../catalog/catalog.module';
import { CreditModule } from '../credit/credit.module';
import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';

@Module({
  imports: [AiModule, CatalogModule, CreditModule],
  providers: [ChallengeService],
  controllers: [ChallengeController],
})
export class ChallengeModule {}
