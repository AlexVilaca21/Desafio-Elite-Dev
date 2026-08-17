import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'modules/shared/dto/pagination-query.dto';

export class SearchAttractionsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  classificationName?: string;
}
