import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  order_id: number;

  @ManyToOne(() => Order, (order) => order.payments)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'text' })
  payment_method: string;

  @Column({ type: 'numeric' })
  amount: number;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => "timezone('America/Bogota', now())",
  })
  payment_date: Date;
}
