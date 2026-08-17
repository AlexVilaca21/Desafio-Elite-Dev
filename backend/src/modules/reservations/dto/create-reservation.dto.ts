import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsString,
  IsUUID,
} from 'class-validator';

export enum PaymentOutcome {
  APPROVE = 'approve',
  DECLINE = 'decline',
}

export class CreateReservationDto {
  @IsString()
  eventId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(6)
  @IsUUID('4', { each: true })
  seatIds: string[];

  @IsEnum(PaymentOutcome)
  paymentOutcome: PaymentOutcome;
}
