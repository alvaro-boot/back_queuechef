import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Topping } from '../../toppings/entities/topping.entity';

@Entity('order_item_toppings')
export class OrderItemTopping {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  order_item_id: number;

  @ManyToOne(() => OrderItem, (orderItem) => orderItem.toppings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItem;

  @Column({ type: 'bigint' })
  topping_id: number;

  @ManyToOne(() => Topping)
  @JoinColumn({ name: 'topping_id' })
  topping: Topping;

  @Column({ type: 'numeric' })
  topping_price: number;
}
