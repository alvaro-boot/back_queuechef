-- Script de seed para datos iniciales
-- Ejecuta este script en tu base de datos PostgreSQL antes de usar el sistema

-- Insertar roles iniciales
INSERT INTO roles (name) VALUES ('Administrador') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('Mesero') ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('Cocina') ON CONFLICT (name) DO NOTHING;

-- Verificar que se insertaron correctamente
SELECT * FROM roles;
