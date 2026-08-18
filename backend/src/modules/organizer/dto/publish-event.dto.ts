import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';
import { MAX_CAPACITY, MIN_CAPACITY } from 'modules/shared/utils/seat-layout';

export class PublishEventDto {
  @IsString()
  ticketmasterId: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/)
  startTime?: string;

  @IsString()
  venueName: string;

  @IsOptional()
  @IsString()
  venueCity?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  venueStateCode?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(9999)
  unitPrice: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(MIN_CAPACITY)
  @Max(MAX_CAPACITY)
  capacity: number;
}
