import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

const toUpperCase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.toUpperCase() : value;

export enum EventSortOrder {
  RELEVANCE_DESC = 'relevance,desc',
  DATE_ASC = 'date,asc',
  DATE_DESC = 'date,desc',
  NAME_ASC = 'name,asc',
  NAME_DESC = 'name,desc',
  DISTANCE_ASC = 'distance,asc',
}

export class SearchEventsQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/)
  @Transform(toUpperCase)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/)
  @Transform(toUpperCase)
  stateCode?: string;

  @IsOptional()
  @IsString()
  venueId?: string;

  @IsOptional()
  @IsString()
  attractionId?: string;

  @IsOptional()
  @IsString()
  classificationName?: string;

  @IsOptional()
  @IsISO8601()
  startDateTime?: string;

  @IsOptional()
  @IsISO8601()
  endDateTime?: string;

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
  @IsEnum(EventSortOrder)
  sort?: EventSortOrder = EventSortOrder.RELEVANCE_DESC;
}
