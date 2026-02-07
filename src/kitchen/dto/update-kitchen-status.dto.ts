import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateKitchenStatusDto {
  @IsString()
  @IsNotEmpty()
  kitchen_status: string;
}
