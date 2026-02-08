-- Migración: Crear tabla de sesiones para tokens
-- Fecha: 2026-02-07
-- Descripción: Crea la tabla sessions para almacenar tokens JWT y controlar sesiones activas

CREATE TABLE IF NOT EXISTS sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);

COMMENT ON TABLE sessions IS 'Almacena los tokens JWT de las sesiones activas de los usuarios';
COMMENT ON COLUMN sessions.token IS 'El token JWT completo';
COMMENT ON COLUMN sessions.is_active IS 'Indica si la sesión está activa (true) o cerrada (false)';
