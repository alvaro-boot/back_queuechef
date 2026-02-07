import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { OrderItemTopping } from '../../orders/entities/order-item-topping.entity';

export enum ToppingStatus {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

@Entity('toppings')
export class Topping {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  store_id: number;

  @ManyToOne(() => Store, (store) => store.toppings)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'numeric' })
  additional_price: number;

  @Column({
    type: 'text',
    enum: ToppingStatus,
  })
  status: ToppingStatus;

  @OneToMany(() => OrderItemTopping, (orderItemTopping) => orderItemTopping.topping)
  orderItemToppings: OrderItemTopping[];
}
