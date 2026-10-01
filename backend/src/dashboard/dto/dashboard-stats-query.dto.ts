import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class DashboardStatsQueryDto {
  /** Length of the trend window, in days, counting today as the last bucket. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(365)
  readonly days: number = 30;
}
