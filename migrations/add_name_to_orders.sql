-- Migración para agregar campo name a la tabla orders
-- Este campo permite identificar los pedidos con un nombre personalizado (ej: "Mesa 5", "Pedido de Juan")

-- Agregar columna name si no existe
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS name TEXT NULL;

-- Crear índice para mejorar búsquedas por nombre (opcional)
CREATE INDEX IF NOT EXISTS idx_orders_name ON orders(name) WHERE name IS NOT NULL;

-- Comentario para documentar el campo
COMMENT ON COLUMN orders.name IS 'Nombre opcional del pedido para identificarlo (ej: Mesa 5, Pedido de Juan, etc.)';
