import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Store } from '../common/decorators/store.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Administrador')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  getDailySales(
    @Store() storeId: number,
    @Query('date') date?: string,
  ) {
    const targetDate = date ? new Date(date) : undefined;
    return this.reportsService.getDailySales(storeId, targetDate);
  }

  @Get('range')
  getSalesByRange(
    @Store() storeId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getSalesByRange(
      storeId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('products')
  getTopProducts(
    @Store() storeId: number,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.reportsService.getTopProducts(storeId, limitNum);
  }

  @Get('summary')
  getSummary(@Store() storeId: number) {
    return this.reportsService.getSummary(storeId);
  }
}
