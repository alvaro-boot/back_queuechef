import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  order_id: number;

  @IsString()
  @IsNotEmpty()
  payment_method: string;

  @IsNumber()
  @Min(0)
  amount: number;
}
