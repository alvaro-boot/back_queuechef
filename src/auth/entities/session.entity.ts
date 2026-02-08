import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('sessions')
@Index(['token'], { unique: true })
@Index(['user_id'])
export class Session {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  user_id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'text', unique: true })
  token: string; // El JWT token completo

  @Column({ type: 'boolean', default: true })
  is_active: boolean; // true = activa, false = cerrada/invalidada

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'now()',
  })
  created_at: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
  })
  expires_at: Date; // Opcional: para limpieza automática de sesiones muy antiguas
}
