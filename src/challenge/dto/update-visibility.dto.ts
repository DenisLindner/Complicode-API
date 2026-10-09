import { IsBoolean } from 'class-validator';

export class UpdateVisibilityDTO {
  @IsBoolean()
  public: boolean;
}
