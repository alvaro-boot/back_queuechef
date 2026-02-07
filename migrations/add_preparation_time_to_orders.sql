-- Migración: Agregar columna preparation_time a la tabla orders
-- Fecha: 2026-02-07
-- Descripción: Agrega un campo para almacenar el tiempo de preparación de cada pedido en segundos

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS preparation_time INTEGER NULL;

COMMENT ON COLUMN orders.preparation_time IS 'Tiempo de preparación del pedido en segundos, calculado desde que inicia la preparación hasta que se completa';
