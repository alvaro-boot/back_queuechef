import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { UserStatus } from '../entities/user.entity';

export class CreateUserDto {
  @IsNumber()
  @IsNotEmpty()
  role_id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  credentials: string;

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;
}
