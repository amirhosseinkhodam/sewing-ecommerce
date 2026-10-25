import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class MessageQueryDto extends PaginationQueryDto {
  override readonly pageSize: number = 20;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => {
    if (value === undefined) return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  readonly isRead?: boolean;
}
