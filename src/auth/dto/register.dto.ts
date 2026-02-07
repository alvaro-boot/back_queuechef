import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class RegisterDto {
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  store_id: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  role_id?: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  credentials: string;

  @IsString()
  @IsOptional()
  status?: string;
}
