-- Migración para agregar campo is_active a la tabla orders
-- Este campo permite hacer soft delete (eliminación lógica) de pedidos

-- Agregar columna is_active si no existe
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_orders_is_active ON orders(is_active);

-- Actualizar todos los pedidos existentes como activos (por si acaso)
UPDATE orders SET is_active = TRUE WHERE is_active IS NULL;
