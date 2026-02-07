import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { Order } from '../../orders/entities/order.entity';

@Entity('kitchen_queue')
export class KitchenQueue {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  store_id: number;

  @ManyToOne(() => Store, (store) => store.kitchenQueues)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ type: 'bigint' })
  order_id: number;

  @ManyToOne(() => Order, (order) => order.kitchenQueues)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'text' })
  kitchen_status: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  start_time: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  end_time: Date;
}
