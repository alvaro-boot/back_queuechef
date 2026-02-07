import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ToppingsService } from './toppings.service';
import { ToppingsController } from './toppings.controller';
import { Topping } from './entities/topping.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Topping])],
  controllers: [ToppingsController],
  providers: [ToppingsService],
  exports: [ToppingsService],
})
export class ToppingsModule {}
