import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentsRepository: Repository<Payment>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  async create(
    createPaymentDto: CreatePaymentDto,
    storeId: number,
  ): Promise<Payment> {
    const order = await this.ordersRepository.findOne({
      where: { id: createPaymentDto.order_id, store_id: storeId },
    });

    if (!order) {
      throw new NotFoundException(
        `Pedido con ID ${createPaymentDto.order_id} no encontrado`,
      );
    }

    if (createPaymentDto.amount <= 0) {
      throw new BadRequestException('El monto debe ser mayor a cero');
    }

    const payment = this.paymentsRepository.create({
      order_id: createPaymentDto.order_id,
      payment_method: createPaymentDto.payment_method,
      amount: createPaymentDto.amount,
    });

    return this.paymentsRepository.save(payment);
  }

  async findByOrder(orderId: number, storeId: number): Promise<Payment[]> {
    const order = await this.ordersRepository.findOne({
      where: { id: orderId, store_id: storeId },
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${orderId} no encontrado`);
    }

    return this.paymentsRepository.find({
      where: { order_id: orderId },
      order: { payment_date: 'DESC' },
    });
  }

  async findAll(
    storeId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Payment[]> {
    const queryBuilder = this.paymentsRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .where('order.store_id = :storeId', { storeId });

    if (startDate) {
      queryBuilder.andWhere('payment.payment_date >= :startDate', {
        startDate,
      });
    }

    if (endDate) {
      queryBuilder.andWhere('payment.payment_date <= :endDate', { endDate });
    }

    queryBuilder.orderBy('payment.payment_date', 'DESC');

    return queryBuilder.getMany();
  }
}
