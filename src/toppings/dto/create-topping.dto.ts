import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { ToppingStatus } from '../entities/topping.entity';

export class CreateToppingDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  additional_price: number;

  @IsEnum(ToppingStatus)
  @IsOptional()
  status?: ToppingStatus;
}
