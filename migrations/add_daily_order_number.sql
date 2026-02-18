-- Agregar columna daily_order_number a la tabla orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS daily_order_number INTEGER;

-- Crear índice para mejorar el rendimiento de las consultas diarias
CREATE INDEX IF NOT EXISTS idx_orders_daily_number ON orders(store_id, DATE(created_at), daily_order_number);

-- Calcular y asignar números diarios para pedidos existentes
-- Esto agrupa los pedidos por tienda y fecha, y asigna números secuenciales
DO $$
DECLARE
    order_rec RECORD;
    current_date DATE;
    current_store INTEGER;
    daily_counter INTEGER;
BEGIN
    -- Inicializar variables
    current_date := NULL;
    current_store := NULL;
    daily_counter := 0;
    
    -- Recorrer todos los pedidos ordenados por tienda, fecha y ID
    FOR order_rec IN 
        SELECT id, store_id, created_at::DATE as order_date
        FROM orders
        WHERE daily_order_number IS NULL
        ORDER BY store_id, created_at::DATE, id
    LOOP
        -- Si cambió la fecha o la tienda, reiniciar el contador
        IF current_date IS NULL OR current_store IS NULL OR 
           order_rec.order_date != current_date OR 
           order_rec.store_id != current_store THEN
            current_date := order_rec.order_date;
            current_store := order_rec.store_id;
            daily_counter := 1;
        ELSE
            daily_counter := daily_counter + 1;
        END IF;
        
        -- Actualizar el número diario del pedido
        UPDATE orders 
        SET daily_order_number = daily_counter
        WHERE id = order_rec.id;
    END LOOP;
END $$;

-- Comentario de la columna
COMMENT ON COLUMN orders.daily_order_number IS 'Número del pedido del día (se reinicia cada día, empieza en 1)';
