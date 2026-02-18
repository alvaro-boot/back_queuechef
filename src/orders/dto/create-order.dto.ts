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

export class CreateOrderItemToppingDto {
  @IsNumber()
  @IsNotEmpty()
  topping_id: number;
}

export class CreateOrderItemDto {
  @IsNumber()
  @IsNotEmpty()
  product_id: number;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemToppingDto)
  @IsOptional()
  toppings?: CreateOrderItemToppingDto[];
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  @IsNotEmpty()
  items: CreateOrderItemDto[];

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string; // Nombre del pedido (opcional)

  @IsString()
  @IsOptional()
  @MaxLength(500)
  comments?: string; // Comentarios o notas del mesero sobre el pedido (opcional)
}
