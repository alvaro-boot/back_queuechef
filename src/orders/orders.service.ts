import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderItemTopping } from './entities/order-item-topping.entity';
import { Product } from '../products/entities/product.entity';
import { Topping } from '../toppings/entities/topping.entity';
import { KitchenQueue } from '../kitchen/entities/kitchen-queue.entity';
import { DailySales } from '../reports/entities/daily-sales.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderResponseDto } from './dto/order-response.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
    @InjectRepository(OrderItemTopping)
    private orderItemToppingsRepository: Repository<OrderItemTopping>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Topping)
    private toppingsRepository: Repository<Topping>,
    @InjectRepository(KitchenQueue)
    private kitchenQueueRepository: Repository<KitchenQueue>,
    @InjectRepository(DailySales)
    private dailySalesRepository: Repository<DailySales>,
    private dataSource: DataSource,
  ) {}

  async create(
    createOrderDto: CreateOrderDto,
    storeId: number,
    waiterId: number,
  ): Promise<OrderResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      // Validar y calcular totales
      for (const itemDto of createOrderDto.items) {
        const product = await this.productsRepository.findOne({
          where: { id: itemDto.product_id, store_id: storeId },
        });

        if (!product) {
          throw new BadRequestException(
            `Producto con ID ${itemDto.product_id} no encontrado`,
          );
        }

        if (!product.availability) {
          throw new BadRequestException(
            `Producto ${product.name} no está disponible`,
          );
        }

        const itemSubtotal = parseFloat(product.base_price.toString()) * itemDto.quantity;
        let itemTotal = itemSubtotal;

        // Validar y calcular toppings
        const toppings: OrderItemTopping[] = [];
        if (itemDto.toppings && itemDto.toppings.length > 0) {
          for (const toppingDto of itemDto.toppings) {
            const topping = await this.toppingsRepository.findOne({
              where: { id: toppingDto.topping_id, store_id: storeId },
            });

            if (!topping) {
              throw new BadRequestException(
                `Topping con ID ${toppingDto.topping_id} no encontrado`,
              );
            }

            if (topping.status !== 'activo') {
              throw new BadRequestException(
                `Topping ${topping.name} no está activo`,
              );
            }

            const toppingPrice = parseFloat(topping.additional_price.toString());
            itemTotal += toppingPrice * itemDto.quantity;

            toppings.push(
              this.orderItemToppingsRepository.create({
                topping_id: topping.id,
                topping_price: toppingPrice,
              }),
            );
          }
        }

        totalAmount += itemTotal;

        const orderItem = this.orderItemsRepository.create({
          product_id: product.id,
          quantity: itemDto.quantity,
          unit_price: product.base_price,
          subtotal: itemSubtotal,
          toppings: toppings,
        });

        orderItems.push(orderItem);
      }

      // Crear pedido
      const order = this.ordersRepository.create({
        store_id: storeId,
        waiter_id: waiterId,
        status: OrderStatus.EN_PROCESO,
        total_amount: totalAmount,
        items: orderItems,
      });

      const savedOrder = await queryRunner.manager.save(order);

      // Crear registro en cola de cocina
      const kitchenQueue = this.kitchenQueueRepository.create({
        store_id: storeId,
        order_id: savedOrder.id,
        kitchen_status: 'Pendiente',
      });

      await queryRunner.manager.save(kitchenQueue);

      // Actualizar o crear daily_sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let dailySales = await queryRunner.manager.findOne(DailySales, {
        where: {
          store_id: storeId,
          sale_date: today,
        },
      });

      if (dailySales) {
        dailySales.total_sales = parseFloat(dailySales.total_sales.toString()) + totalAmount;
        dailySales.order_count += 1;
        await queryRunner.manager.save(dailySales);
      } else {
        dailySales = this.dailySalesRepository.create({
          store_id: storeId,
          sale_date: today,
          total_sales: totalAmount,
          order_count: 1,
        });
        await queryRunner.manager.save(dailySales);
      }

      await queryRunner.commitTransaction();

      // Recargar con relaciones
      const orderWithRelations = await this.ordersRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product', 'items.toppings', 'items.toppings.topping'],
      });

      return OrderResponseDto.fromEntity(orderWithRelations);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(
    storeId: number,
    status?: OrderStatus,
    startDate?: Date,
    endDate?: Date,
  ): Promise<OrderResponseDto[]> {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.toppings', 'toppings')
      .leftJoinAndSelect('toppings.topping', 'topping')
      .where('order.store_id = :storeId', { storeId });

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    if (startDate) {
      queryBuilder.andWhere('order.created_at >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('order.created_at <= :endDate', { endDate });
    }

    queryBuilder.orderBy('order.created_at', 'DESC');

    const orders = await queryBuilder.getMany();
    return orders.map((order) => OrderResponseDto.fromEntity(order));
  }

  async findOne(id: number, storeId: number): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id, store_id: storeId },
      relations: ['items', 'items.product', 'items.toppings', 'items.toppings.topping'],
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    return OrderResponseDto.fromEntity(order);
  }

  async updateStatus(
    id: number,
    updateOrderStatusDto: UpdateOrderStatusDto,
    storeId: number,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id, store_id: storeId },
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    order.status = updateOrderStatusDto.status;
    const updatedOrder = await this.ordersRepository.save(order);

    const orderWithRelations = await this.ordersRepository.findOne({
      where: { id: updatedOrder.id },
      relations: ['items', 'items.product', 'items.toppings', 'items.toppings.topping'],
    });

    return OrderResponseDto.fromEntity(orderWithRelations);
  }

  async remove(id: number, storeId: number): Promise<void> {
    const order = await this.ordersRepository.findOne({
      where: { id, store_id: storeId },
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    await this.ordersRepository.remove(order);
  }
}
