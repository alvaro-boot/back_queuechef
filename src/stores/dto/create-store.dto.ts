import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { StoreStatus } from '../entities/store.entity';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsEnum(StoreStatus)
  @IsOptional()
  status?: StoreStatus;
}
