-- Agregar columna comments a la tabla orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS comments TEXT;

-- Comentario de la columna
COMMENT ON COLUMN orders.comments IS 'Comentarios o notas del mesero sobre el pedido';
