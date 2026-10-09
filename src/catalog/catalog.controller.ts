import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { CatalogService } from './catalog.service';

@ApiTags('catalog')
@Public()
@Controller('catalog')
export class CatalogController {
  constructor(private readonly service: CatalogService) {}

  @Get('stacks')
  async stacks() {
    return await this.service.findStacks();
  }

  @Get('levels')
  levels() {
    return this.service.findLevels();
  }
}
