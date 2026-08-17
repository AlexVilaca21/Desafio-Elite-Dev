import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { LocationQueryDto } from 'modules/shared/dto/location-query.dto';

export enum VenueSortOrder {
  RELEVANCE_DESC = 'relevance,desc',
  NAME_ASC = 'name,asc',
  NAME_DESC = 'name,desc',
  DISTANCE_ASC = 'distance,asc',
}

export class SearchVenuesQueryDto extends LocationQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  size?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @IsOptional()
  @IsEnum(VenueSortOrder)
  sort?: VenueSortOrder = VenueSortOrder.RELEVANCE_DESC;
}
