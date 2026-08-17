import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

const toUpperCase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.toUpperCase() : value;

export class LocationQueryDto {
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
}
