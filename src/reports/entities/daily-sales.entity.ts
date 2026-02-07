import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

@Entity('daily_sales')
export class DailySales {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  store_id: number;

  @ManyToOne(() => Store, (store) => store.dailySales)
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ type: 'date' })
  sale_date: Date;

  @Column({ type: 'numeric' })
  total_sales: number;

  @Column({ type: 'int' })
  order_count: number;
}
