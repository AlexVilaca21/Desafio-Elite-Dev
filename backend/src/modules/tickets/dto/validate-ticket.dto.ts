import { IsOptional, IsString } from 'class-validator';

export class ValidateTicketDto {
  @IsOptional()
  @IsString()
  qrPayload?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  eventId?: string;
}
