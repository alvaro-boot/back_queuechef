-- Migración para configurar zona horaria de Colombia en PostgreSQL
-- Ejecutar este script en la base de datos para asegurar que las fechas se guarden en hora de Colombia

-- Configurar la zona horaria de la sesión actual
SET timezone = 'America/Bogota';

-- Actualizar los defaults de las columnas created_at para usar hora de Colombia
-- Nota: Esto solo afecta a nuevas filas. Las filas existentes mantendrán su hora UTC.

-- Para la tabla orders
ALTER TABLE orders 
ALTER COLUMN created_at 
SET DEFAULT timezone('America/Bogota', now());

-- Para la tabla stores
ALTER TABLE stores 
ALTER COLUMN created_at 
SET DEFAULT timezone('America/Bogota', now());

-- Para la tabla payments
ALTER TABLE payments 
ALTER COLUMN payment_date 
SET DEFAULT timezone('America/Bogota', now());

-- Para la tabla sessions
ALTER TABLE sessions 
ALTER COLUMN created_at 
SET DEFAULT timezone('America/Bogota', now());

-- Verificar la configuración
SHOW timezone;
