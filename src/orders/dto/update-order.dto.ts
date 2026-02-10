import {
  IsArray,
  ValidateNested,
  IsNumber,
  IsNotEmpty,
  Min,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderItemDto } from './create-order.dto';

export class UpdateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsNotEmpty()
  items: CreateOrderItemDto[];

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string; // Nombre del pedido (opcional)
}
