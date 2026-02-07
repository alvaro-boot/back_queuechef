import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { DatabaseModule } from './config/database.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { ToppingsModule } from './toppings/toppings.module';
import { OrdersModule } from './orders/orders.module';
import { KitchenModule } from './kitchen/kitchen.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { StoreFilterInterceptor } from './common/interceptors/store-filter.interceptor';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    StoresModule,
    RolesModule,
    UsersModule,
    ProductsModule,
    ToppingsModule,
    OrdersModule,
    KitchenModule,
    PaymentsModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: StoreFilterInterceptor,
    },
  ],
})
export class AppModule {}
