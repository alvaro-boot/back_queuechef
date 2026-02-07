import { IsDateString, IsOptional } from 'class-validator';

export class SalesReportDto {
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;
}
