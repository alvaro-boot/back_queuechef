import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { KitchenQueue } from './entities/kitchen-queue.entity';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { UpdateKitchenStatusDto } from './dto/update-kitchen-status.dto';
import { KitchenQueueResponseDto } from './dto/kitchen-queue-response.dto';

@Injectable()
export class KitchenService {
  constructor(
    @InjectRepository(KitchenQueue)
    private kitchenQueueRepository: Repository<KitchenQueue>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
  ) {}

  async findAll(storeId: number): Promise<KitchenQueueResponseDto[]> {
    const queues = await this.kitchenQueueRepository.find({
      where: { store_id: storeId },
      relations: ['order', 'order.items', 'order.items.product', 'order.items.toppings', 'order.items.toppings.topping'],
      order: { id: 'ASC' },
    });

    return queues.map((queue) => KitchenQueueResponseDto.fromEntity(queue));
  }

  async findOne(id: number, storeId: number): Promise<KitchenQueueResponseDto> {
    const queue = await this.kitchenQueueRepository.findOne({
      where: { id, store_id: storeId },
      relations: ['order', 'order.items', 'order.items.product', 'order.items.toppings', 'order.items.toppings.topping'],
    });

    if (!queue) {
      throw new NotFoundException(
        `Registro de cola con ID ${id} no encontrado`,
      );
    }

    return KitchenQueueResponseDto.fromEntity(queue);
  }

  async startPreparation(id: number, storeId: number): Promise<KitchenQueueResponseDto> {
    const queue = await this.kitchenQueueRepository.findOne({
      where: { id, store_id: storeId },
    });

    if (!queue) {
      throw new NotFoundException(
        `Registro de cola con ID ${id} no encontrado`,
      );
    }

    if (queue.start_time) {
      throw new BadRequestException('La preparación ya ha comenzado');
    }

    queue.kitchen_status = 'En preparación';
    queue.start_time = new Date();

    const savedQueue = await this.kitchenQueueRepository.save(queue);

    const queueWithRelations = await this.kitchenQueueRepository.findOne({
      where: { id: savedQueue.id },
      relations: ['order', 'order.items', 'order.items.product', 'order.items.toppings', 'order.items.toppings.topping'],
    });

    return KitchenQueueResponseDto.fromEntity(queueWithRelations);
  }

  async completePreparation(id: number, storeId: number): Promise<KitchenQueueResponseDto> {
    const queue = await this.kitchenQueueRepository.findOne({
      where: { id, store_id: storeId },
      relations: ['order'],
    });

    if (!queue) {
      throw new NotFoundException(
        `Registro de cola con ID ${id} no encontrado`,
      );
    }

    if (!queue.start_time) {
      throw new BadRequestException('La preparación no ha comenzado');
    }

    queue.kitchen_status = 'Listo';
    queue.end_time = new Date();

    // Actualizar estado del pedido y calcular tiempo de preparación
    if (queue.order) {
      queue.order.status = OrderStatus.ENTREGADO;
      
      // Calcular tiempo de preparación en segundos
      if (queue.start_time && queue.end_time) {
        const startTime = new Date(queue.start_time).getTime();
        const endTime = new Date(queue.end_time).getTime();
        const preparationTimeSeconds = Math.round((endTime - startTime) / 1000);
        queue.order.preparation_time = preparationTimeSeconds;
      }
      
      await this.ordersRepository.save(queue.order);
    }

    const savedQueue = await this.kitchenQueueRepository.save(queue);

    const queueWithRelations = await this.kitchenQueueRepository.findOne({
      where: { id: savedQueue.id },
      relations: ['order', 'order.items', 'order.items.product', 'order.items.toppings', 'order.items.toppings.topping'],
    });

    return KitchenQueueResponseDto.fromEntity(queueWithRelations);
  }
}
