import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Store } from '../stores/entities/store.entity';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { Product } from '../products/entities/product.entity';
import { Topping } from '../toppings/entities/topping.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OrderItemTopping } from '../orders/entities/order-item-topping.entity';
import { KitchenQueue } from '../kitchen/entities/kitchen-queue.entity';
import { Payment } from '../payments/entities/payment.entity';
import { DailySales } from '../reports/entities/daily-sales.entity';
import { Session } from '../auth/entities/session.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot(
      // Si existe DATABASE_URL, usarla directamente (más confiable para Render)
      process.env.DATABASE_URL
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            entities: [
              Store,
              Role,
              User,
              Product,
              Topping,
              Order,
              OrderItem,
              OrderItemTopping,
              KitchenQueue,
              Payment,
              DailySales,
              Session,
            ],
            synchronize: process.env.NODE_ENV === 'development',
            logging: process.env.NODE_ENV === 'development',
            ssl: {
              rejectUnauthorized: false, // Render requiere SSL pero permite certificados autofirmados
            },
          }
        : {
            // Fallback a parámetros individuales
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432'),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            database: process.env.DB_DATABASE || 'queuechef',
            entities: [
              Store,
              Role,
              User,
              Product,
              Topping,
              Order,
              OrderItem,
              OrderItemTopping,
              KitchenQueue,
              Payment,
              DailySales,
              Session,
            ],
            synchronize: process.env.NODE_ENV === 'development',
            logging: process.env.NODE_ENV === 'development',
            ssl: process.env.DB_SSL === 'true' ? {
              rejectUnauthorized: false, // Render requiere SSL pero permite certificados autofirmados
            } : false,
          }
    ),
  ],
})
export class DatabaseModule {}
