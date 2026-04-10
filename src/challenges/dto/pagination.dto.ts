import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class PaginationDTO {
  @IsInt()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  take?: number = 10;

  @IsInt()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  skip?: number = 0;
}
