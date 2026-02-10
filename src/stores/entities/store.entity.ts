import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Product } from '../../products/entities/product.entity';
import { Topping } from '../../toppings/entities/topping.entity';
import { Order } from '../../orders/entities/order.entity';
import { KitchenQueue } from '../../kitchen/entities/kitchen-queue.entity';
import { DailySales } from '../../reports/entities/daily-sales.entity';

export enum StoreStatus {
  ACTIVA = 'activa',
  INACTIVA = 'inactiva',
}

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'text' })
  phone: string;

  @Column({
    type: 'text',
    enum: StoreStatus,
  })
  status: StoreStatus;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => "timezone('America/Bogota', now())",
  })
  created_at: Date;

  @OneToMany(() => User, (user) => user.store)
  users: User[];

  @OneToMany(() => Product, (product) => product.store)
  products: Product[];

  @OneToMany(() => Topping, (topping) => topping.store)
  toppings: Topping[];

  @OneToMany(() => Order, (order) => order.store)
  orders: Order[];

  @OneToMany(() => KitchenQueue, (queue) => queue.store)
  kitchenQueues: KitchenQueue[];

  @OneToMany(() => DailySales, (sales) => sales.store)
  dailySales: DailySales[];
}
