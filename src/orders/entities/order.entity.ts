import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { User } from '../../users/entities/user.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { KitchenQueue } from '../../kitchen/entities/kitchen-queue.entity';

export enum OrderStatus {
  EN_PROCESO = 'En proceso',
  ENTREGADO = 'Entregado',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  store_id: number;

  @ManyToOne(() => Store, (store) => store.orders)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ type: 'bigint', nullable: true })
  waiter_id: number;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'waiter_id' })
  waiter: User;

  @Column({
    type: 'text',
    enum: OrderStatus,
  })
  status: OrderStatus;

  @Column({ type: 'numeric' })
  total_amount: number;

  @Column({ type: 'integer', nullable: true })
  preparation_time: number; // Tiempo de preparación en minutos

  @Column({ type: 'boolean', default: true })
  is_active: boolean; // true = activo, false = desactivado (eliminado lógicamente)

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => "timezone('America/Bogota', now())",
  })
  created_at: Date;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];

  @OneToMany(() => KitchenQueue, (queue) => queue.order)
  kitchenQueues: KitchenQueue[];
}
