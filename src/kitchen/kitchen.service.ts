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
    // Calcular el inicio y fin del día actual en Colombia (America/Bogota)
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // Filtrar solo pedidos del día actual
    const queues = await this.kitchenQueueRepository
      .createQueryBuilder('queue')
      .leftJoinAndSelect('queue.order', 'order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.toppings', 'toppings')
      .leftJoinAndSelect('toppings.topping', 'topping')
      .where('queue.store_id = :storeId', { storeId })
      .andWhere('order.is_active = :isActive', { isActive: true }) // Solo pedidos activos
      .andWhere('order.created_at >= :todayStart', { todayStart }) // Desde inicio del día
      .andWhere('order.created_at < :tomorrowStart', { tomorrowStart }) // Hasta inicio del día siguiente
      .orderBy('queue.id', 'ASC')
      .getMany();

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
      relations: ['order'],
    });

    if (!queue) {
      throw new NotFoundException(
        `Registro de cola con ID ${id} no encontrado`,
      );
    }

    if (queue.order && !queue.order.is_active) {
      throw new BadRequestException('No se puede iniciar la preparación de un pedido desactivado');
    }

    if (queue.start_time) {
      throw new BadRequestException('La preparación ya ha comenzado');
    }

    queue.kitchen_status = 'En preparación';
    // Usar la hora de Colombia
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

    if (queue.order && !queue.order.is_active) {
      throw new BadRequestException('No se puede completar la preparación de un pedido desactivado');
    }

    if (!queue.start_time) {
      throw new BadRequestException('La preparación no ha comenzado');
    }

    queue.kitchen_status = 'Listo';
    queue.end_time = new Date();

    // Actualizar estado del pedido y calcular tiempo de preparación
    if (queue.order) {
      queue.order.status = OrderStatus.ENTREGADO;
      
      // Calcular tiempo de preparación en minutos
      if (queue.start_time && queue.end_time) {
        const startTime = new Date(queue.start_time).getTime();
        const endTime = new Date(queue.end_time).getTime();
        const preparationTimeMinutes = Math.round((endTime - startTime) / (1000 * 60)); // Convertir a minutos
        queue.order.preparation_time = preparationTimeMinutes;
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
