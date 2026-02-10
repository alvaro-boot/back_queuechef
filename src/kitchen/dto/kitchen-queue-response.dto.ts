import { KitchenQueue } from '../entities/kitchen-queue.entity';

export class KitchenQueueResponseDto {
  id: number;
  store_id: number;
  order_id: number;
  kitchen_status: string;
  start_time: Date;
  end_time: Date;
  order: any;

  static fromEntity(queue: KitchenQueue): KitchenQueueResponseDto {
    return {
      id: queue.id,
      store_id: queue.store_id,
      order_id: queue.order_id,
      kitchen_status: queue.kitchen_status,
      start_time: queue.start_time,
      end_time: queue.end_time,
      order: queue.order
        ? {
            id: queue.order.id,
            name: queue.order.name || null,
            status: queue.order.status,
            total_amount: parseFloat(queue.order.total_amount.toString()),
            created_at: queue.order.created_at,
            items: queue.order.items?.map((item) => ({
              id: item.id,
              product: item.product
                ? {
                    id: item.product.id,
                    name: item.product.name,
                  }
                : null,
              quantity: item.quantity,
              toppings: item.toppings?.map((topping) => ({
                topping: topping.topping
                  ? {
                      name: topping.topping.name,
                    }
                  : null,
              })),
            })),
          }
        : null,
    };
  }
}
