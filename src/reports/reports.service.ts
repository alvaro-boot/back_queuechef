import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DailySales } from './entities/daily-sales.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(DailySales)
    private dailySalesRepository: Repository<DailySales>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemsRepository: Repository<OrderItem>,
  ) {}

  async getDailySales(storeId: number, date?: Date) {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    return this.dailySalesRepository.find({
      where: {
        store_id: storeId,
        sale_date: targetDate,
      },
      order: { sale_date: 'DESC' },
    });
  }

  async getSalesByRange(
    storeId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<DailySales[]> {
    return this.dailySalesRepository.find({
      where: {
        store_id: storeId,
        sale_date: Between(startDate, endDate),
      },
      order: { sale_date: 'DESC' },
    });
  }

  async getTopProducts(storeId: number, limit = 10) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Últimos 30 días

    const orderItems = await this.orderItemsRepository
      .createQueryBuilder('orderItem')
      .leftJoin('orderItem.order', 'order')
      .leftJoin('orderItem.product', 'product')
      .where('order.store_id = :storeId', { storeId })
      .andWhere('order.created_at >= :startDate', { startDate })
      .select('product.id', 'productId')
      .addSelect('product.name', 'productName')
      .addSelect('SUM(orderItem.quantity)', 'totalQuantity')
      .addSelect('SUM(orderItem.subtotal)', 'totalRevenue')
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('SUM(orderItem.quantity)', 'DESC')
      .limit(limit)
      .getRawMany();

    return orderItems.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      totalQuantity: parseInt(item.totalQuantity),
      totalRevenue: parseFloat(item.totalRevenue),
    }));
  }

  async getSummary(storeId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaySales = await this.dailySalesRepository.findOne({
      where: {
        store_id: storeId,
        sale_date: today,
      },
    });

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlySales = await this.dailySalesRepository
      .createQueryBuilder('dailySales')
      .where('dailySales.store_id = :storeId', { storeId })
      .andWhere('dailySales.sale_date >= :thisMonth', { thisMonth })
      .select('SUM(dailySales.total_sales)', 'totalSales')
      .addSelect('SUM(dailySales.order_count)', 'totalOrders')
      .getRawOne();

    return {
      today: {
        totalSales: todaySales
          ? parseFloat(todaySales.total_sales.toString())
          : 0,
        orderCount: todaySales ? todaySales.order_count : 0,
      },
      thisMonth: {
        totalSales: monthlySales?.totalSales
          ? parseFloat(monthlySales.totalSales)
          : 0,
        totalOrders: monthlySales?.totalOrders
          ? parseInt(monthlySales.totalOrders)
          : 0,
      },
    };
  }
}
