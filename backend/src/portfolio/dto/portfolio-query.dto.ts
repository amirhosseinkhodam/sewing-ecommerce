import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class PortfolioQueryDto extends PaginationQueryDto {
  override readonly pageSize: number = 12;

  /** Category slug, matching the public catalog's `category` filter. */
  @IsOptional()
  @IsString()
  readonly category?: string;

  @IsOptional()
  @IsString()
  readonly search?: string;
}
