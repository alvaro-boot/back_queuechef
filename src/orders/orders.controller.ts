import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './entities/order.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Store } from '../common/decorators/store.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('Mesero')
  create(
    @Body() createOrderDto: CreateOrderDto,
    @Store() storeId: number,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.create(createOrderDto, storeId, user.userId);
  }

  @Get()
  findAll(
    @Store() storeId: number,
    @Query('status') status?: OrderStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.ordersService.findAll(storeId, status, start, end);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Store() storeId: number) {
    return this.ordersService.findOne(id, storeId);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles('Cocina', 'Administrador')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Store() storeId: number,
  ) {
    return this.ordersService.updateStatus(id, updateOrderStatusDto, storeId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('Mesero', 'Administrador') // Meseros y administradores pueden desactivar pedidos
  remove(@Param('id', ParseIntPipe) id: number, @Store() storeId: number) {
    return this.ordersService.remove(id, storeId);
  }
}
