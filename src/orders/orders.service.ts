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
import { UpdateOrderDto } from './dto/update-order.dto';
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

      // Calcular el número del pedido del día (usando zona horaria de Colombia)
      // Obtener la fecha actual en Colombia (America/Bogota)
      const now = new Date();
      
      // Obtener el último número de pedido del día para esta tienda
      // Usamos una consulta SQL directa para mayor control
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      
      // Consulta usando raw SQL para mayor precisión con zona horaria
      // Usamos try-catch para manejar el caso donde la columna no existe aún
      let dailyOrderNumber = 1;
      try {
        const lastOrderTodayResult = await queryRunner.manager.query(
          `SELECT daily_order_number 
           FROM orders 
           WHERE store_id = $1 
           AND created_at >= $2 
           AND created_at < $3 
           AND daily_order_number IS NOT NULL
           ORDER BY daily_order_number DESC 
           LIMIT 1`,
          [storeId, todayStart, tomorrowStart]
        );

        const lastOrderToday = lastOrderTodayResult && lastOrderTodayResult.length > 0 
          ? lastOrderTodayResult[0] 
          : null;

        dailyOrderNumber = lastOrderToday?.daily_order_number
          ? lastOrderToday.daily_order_number + 1
          : 1;
      } catch (error) {
        // Si la columna no existe, empezamos desde 1
        console.warn(`[OrdersService] Error al consultar daily_order_number (puede que la columna no exista aún):`, error.message);
        dailyOrderNumber = 1;
      }

      console.log(`[OrdersService] Calculando daily_order_number para store_id=${storeId}: ${dailyOrderNumber}`);

      // Crear pedido
      const order = this.ordersRepository.create({
        store_id: storeId,
        waiter_id: waiterId,
        name: createOrderDto.name?.trim() || null, // Nombre del pedido (opcional)
        comments: createOrderDto.comments?.trim() || null, // Comentarios del mesero (opcional)
        daily_order_number: dailyOrderNumber, // Número del pedido del día
        status: OrderStatus.EN_PROCESO,
        total_amount: totalAmount,
        items: orderItems,
        is_active: true, // Todos los pedidos nuevos son activos
      });

      const savedOrder = await queryRunner.manager.save(order);
      
      console.log(`[OrdersService] Pedido guardado con ID=${savedOrder.id}, daily_order_number=${savedOrder.daily_order_number}`);

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

      if (!orderWithRelations) {
        throw new Error('No se pudo recargar el pedido después de guardarlo');
      }

      console.log(`[OrdersService] Pedido recargado - ID=${orderWithRelations.id}, daily_order_number=${orderWithRelations.daily_order_number}`);

      // Un pedido recién creado no está en preparación
      const isInPreparation = false;

      return OrderResponseDto.fromEntity(orderWithRelations, isInPreparation);
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
    allDates?: boolean, // Si es true, no filtrar por fecha (para administrador)
  ): Promise<OrderResponseDto[]> {
    const queryBuilder = this.ordersRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoinAndSelect('items.toppings', 'toppings')
      .leftJoinAndSelect('toppings.topping', 'topping')
      .where('order.store_id = :storeId', { storeId })
      .andWhere('order.is_active = :isActive', { isActive: true }); // Solo pedidos activos

    if (status) {
      queryBuilder.andWhere('order.status = :status', { status });
    }

    // Si allDates es true, no filtrar por fecha (para administrador)
    if (allDates) {
      // No agregar filtros de fecha
    } else if (!startDate && !endDate) {
      // Si no se proporcionan fechas y no es allDates, filtrar por el día actual
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const tomorrowStart = new Date(todayStart);
      tomorrowStart.setDate(tomorrowStart.getDate() + 1);
      
      queryBuilder.andWhere('order.created_at >= :todayStart', { todayStart });
      queryBuilder.andWhere('order.created_at < :tomorrowStart', { tomorrowStart });
    } else {
      // Si se proporcionan fechas explícitas, usarlas
      if (startDate) {
        queryBuilder.andWhere('order.created_at >= :startDate', { startDate });
      }

      if (endDate) {
        queryBuilder.andWhere('order.created_at <= :endDate', { endDate });
      }
    }

    // Ordenar por fecha de creación descendente (más recientes primero)
    queryBuilder.orderBy('order.created_at', 'DESC');

    const orders = await queryBuilder.getMany();
    
    // Verificar si cada pedido está en preparación
    // Promise.all mantiene el orden de los resultados, así que el ordenamiento se preserva
    const ordersWithPreparationStatus = await Promise.all(
      orders.map(async (order) => {
        const kitchenQueue = await this.kitchenQueueRepository.findOne({
          where: { order_id: order.id, store_id: storeId },
        });
        const isInPreparation = kitchenQueue?.start_time ? true : false;
        return OrderResponseDto.fromEntity(order, isInPreparation);
      })
    );
    
    return ordersWithPreparationStatus;
  }

  async findOne(id: number, storeId: number): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id, store_id: storeId, is_active: true }, // Solo pedidos activos
      relations: ['items', 'items.product', 'items.toppings', 'items.toppings.topping'],
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    // Verificar si el pedido está en preparación
    const kitchenQueue = await this.kitchenQueueRepository.findOne({
      where: { order_id: id, store_id: storeId },
    });
    const isInPreparation = kitchenQueue?.start_time ? true : false;

    return OrderResponseDto.fromEntity(order, isInPreparation);
  }

  async update(
    id: number,
    updateOrderDto: UpdateOrderDto,
    storeId: number,
  ): Promise<OrderResponseDto> {
    // Verificar que el pedido existe y está activo
    const order = await this.ordersRepository.findOne({
      where: { id, store_id: storeId, is_active: true },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado o está desactivado`);
    }

    // Verificar que el pedido no esté en preparación
    const kitchenQueue = await this.kitchenQueueRepository.findOne({
      where: { order_id: id, store_id: storeId },
    });

    if (kitchenQueue && kitchenQueue.start_time) {
      throw new BadRequestException(
        'No se puede modificar un pedido que ya está en preparación',
      );
    }

    // Si el pedido está entregado, no se puede modificar
    if (order.status === OrderStatus.ENTREGADO) {
      throw new BadRequestException('No se puede modificar un pedido que ya fue entregado');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Eliminar items existentes
      if (order.items && order.items.length > 0) {
        await queryRunner.manager.remove(order.items);
      }

      // Calcular nuevos totales
      let totalAmount = 0;
      const orderItems: OrderItem[] = [];

      for (const itemDto of updateOrderDto.items) {
        const product = await this.productsRepository.findOne({
          where: { id: itemDto.product_id, store_id: storeId },
        });

        if (!product) {
          throw new BadRequestException(
            `Producto con ID ${itemDto.product_id} no encontrado`,
          );
        }

        if (!product.availability) {
          throw new BadRequestException(`Producto ${product.name} no está disponible`);
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
              throw new BadRequestException(`Topping ${topping.name} no está activo`);
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

        orderItems.push(
          this.orderItemsRepository.create({
            product_id: product.id,
            quantity: itemDto.quantity,
            unit_price: product.base_price,
            subtotal: itemSubtotal,
            toppings: toppings,
          }),
        );
      }

      // Actualizar pedido
      order.items = orderItems;
      order.total_amount = totalAmount;
      if (updateOrderDto.name !== undefined) {
        order.name = updateOrderDto.name?.trim() || null;
      }
      if (updateOrderDto.comments !== undefined) {
        order.comments = updateOrderDto.comments?.trim() || null;
      }

      const savedOrder = await queryRunner.manager.save(order);

      // Guardar el monto anterior antes de actualizar
      const oldAmount = parseFloat(order.total_amount.toString());
      
      // Actualizar daily_sales restando el monto anterior y sumando el nuevo
      const orderDate = new Date(order.created_at);
      orderDate.setHours(0, 0, 0, 0);

      const dailySales = await queryRunner.manager.findOne(DailySales, {
        where: {
          store_id: storeId,
          sale_date: orderDate,
        },
      });

      if (dailySales) {
        const newAmount = totalAmount;
        const currentTotal = parseFloat(dailySales.total_sales.toString());
        
        // Restar el monto anterior y sumar el nuevo
        dailySales.total_sales = Math.max(0, currentTotal - oldAmount + newAmount);
        
        await queryRunner.manager.save(dailySales);
      }

      await queryRunner.commitTransaction();

      // Recargar con relaciones
      const orderWithRelations = await this.ordersRepository.findOne({
        where: { id: savedOrder.id },
        relations: ['items', 'items.product', 'items.toppings', 'items.toppings.topping'],
      });

      // Verificar si el pedido está en preparación
      const kitchenQueue = await this.kitchenQueueRepository.findOne({
        where: { order_id: savedOrder.id, store_id: storeId },
      });
      const isInPreparation = kitchenQueue?.start_time ? true : false;

      return OrderResponseDto.fromEntity(orderWithRelations, isInPreparation);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(
    id: number,
    updateOrderStatusDto: UpdateOrderStatusDto,
    storeId: number,
  ): Promise<OrderResponseDto> {
    const order = await this.ordersRepository.findOne({
      where: { id, store_id: storeId, is_active: true }, // Solo pedidos activos
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado o está desactivado`);
    }

    order.status = updateOrderStatusDto.status;
    const updatedOrder = await this.ordersRepository.save(order);

    const orderWithRelations = await this.ordersRepository.findOne({
      where: { id: updatedOrder.id },
      relations: ['items', 'items.product', 'items.toppings', 'items.toppings.topping'],
    });

    // Verificar si el pedido está en preparación
    const kitchenQueue = await this.kitchenQueueRepository.findOne({
      where: { order_id: updatedOrder.id, store_id: storeId },
    });
    const isInPreparation = kitchenQueue?.start_time ? true : false;

    return OrderResponseDto.fromEntity(orderWithRelations, isInPreparation);
  }

  async remove(id: number, storeId: number): Promise<{ message: string }> {
    const order = await this.ordersRepository.findOne({
      where: { id, store_id: storeId },
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    if (!order.is_active) {
      throw new BadRequestException('El pedido ya está desactivado');
    }

    // Desactivar el pedido en lugar de eliminarlo físicamente
    order.is_active = false;
    await this.ordersRepository.save(order);

    // Actualizar daily_sales restando el monto y decrementando el conteo
    const orderDate = new Date(order.created_at);
    orderDate.setHours(0, 0, 0, 0);

    const dailySales = await this.dailySalesRepository.findOne({
      where: {
        store_id: storeId,
        sale_date: orderDate,
      },
    });

    if (dailySales) {
      const orderAmount = parseFloat(order.total_amount.toString());
      const currentTotal = parseFloat(dailySales.total_sales.toString());
      
      // Restar el monto del pedido desactivado
      dailySales.total_sales = Math.max(0, currentTotal - orderAmount);
      
      // Decrementar el conteo de pedidos
      dailySales.order_count = Math.max(0, dailySales.order_count - 1);
      
      await this.dailySalesRepository.save(dailySales);
    }

    return { message: 'Pedido desactivado exitosamente' };
  }
}
