import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { Role } from '../../roles/entities/role.entity';
import { Order } from '../../orders/entities/order.entity';

export enum UserStatus {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint', nullable: true })
  store_id: number;

  @ManyToOne(() => Store, (store) => store.users)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ type: 'bigint', nullable: true })
  role_id: number;

  @ManyToOne(() => Role, (role) => role.users)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  credentials: string;

  @Column({
    type: 'text',
    enum: UserStatus,
  })
  status: UserStatus;

  @OneToMany(() => Order, (order) => order.waiter)
  orders: Order[];
}
