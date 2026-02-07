import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemTopping } from './entities/order-item-topping.entity';
import { Product } from '../products/entities/product.entity';
import { Topping } from '../toppings/entities/topping.entity';
import { KitchenQueue } from '../kitchen/entities/kitchen-queue.entity';
import { DailySales } from '../reports/entities/daily-sales.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      OrderItemTopping,
      Product,
      Topping,
      KitchenQueue,
      DailySales,
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
