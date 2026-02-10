-- Migración para convertir preparation_time de segundos a minutos
-- Si hay datos existentes, se convertirán de segundos a minutos dividiendo por 60

-- Actualizar todos los valores existentes de segundos a minutos
UPDATE orders
SET preparation_time = ROUND(preparation_time / 60.0)
WHERE preparation_time IS NOT NULL AND preparation_time > 0;

-- Nota: Los nuevos pedidos se guardarán directamente en minutos
