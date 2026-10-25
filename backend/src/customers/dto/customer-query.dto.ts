import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { Role } from '../../generated/prisma/client';

export class CustomerQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  readonly search?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(Object.values(Role))
  readonly role?: Role;
}
