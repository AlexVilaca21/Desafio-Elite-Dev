import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from 'modules/shared/dto/pagination-query.dto';

export class SearchClassificationsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;
}
