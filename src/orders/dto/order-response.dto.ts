import { Order } from '../entities/order.entity';

export class OrderResponseDto {
  id: number;
  store_id: number;
  waiter_id: number;
  name: string | null; // Nombre del pedido
  comments: string | null; // Comentarios o notas del mesero sobre el pedido
  daily_order_number: number | null; // Número del pedido del día (se reinicia cada día)
  status: string;
  total_amount: number;
  preparation_time: number | null; // Tiempo de preparación en minutos
  is_in_preparation: boolean; // Indica si el pedido está en preparación (tiene start_time en kitchen_queue)
  created_at: Date;
  items: any[];

  static fromEntity(order: Order, isInPreparation: boolean = false): OrderResponseDto {
    return {
      id: order.id,
      store_id: order.store_id,
      waiter_id: order.waiter_id,
      name: order.name || null,
      comments: order.comments || null,
      daily_order_number: order.daily_order_number || null,
      status: order.status,
      total_amount: parseFloat(order.total_amount.toString()),
      preparation_time: order.preparation_time || null,
      is_in_preparation: isInPreparation,
      created_at: order.created_at,
      items: order.items?.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              description: item.product.description,
            }
          : null,
        quantity: item.quantity,
        unit_price: parseFloat(item.unit_price.toString()),
        subtotal: parseFloat(item.subtotal.toString()),
        toppings: item.toppings?.map((topping) => ({
          id: topping.id,
          topping_id: topping.topping_id,
          topping: topping.topping
            ? {
                id: topping.topping.id,
                name: topping.topping.name,
              }
            : null,
          topping_price: parseFloat(topping.topping_price.toString()),
        })),
      })),
    };
  }
}
