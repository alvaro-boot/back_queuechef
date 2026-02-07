# Sistema Multi-tienda de Gestión de Pedidos

Backend desarrollado con NestJS para la gestión de pedidos de comida en múltiples tiendas.

## Características

- Sistema multi-tienda con aislamiento de datos
- Autenticación JWT con roles (Administrador, Mesero, Cocina)
- Gestión completa de productos, toppings y pedidos
- Cola de cocina en tiempo real
- Sistema de pagos y reportes
- API RESTful completa

## Requisitos

- Node.js 18+ 
- PostgreSQL 14+
- npm o yarn

## Instalación

1. Clonar el repositorio
2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus credenciales de base de datos
```

4. Crear la base de datos PostgreSQL:
```sql
CREATE DATABASE comidas_rapidas;
```

5. Ejecutar las migraciones SQL proporcionadas en la base de datos

6. Iniciar el servidor:
```bash
npm run start:dev
```

El servidor estará disponible en `http://localhost:3000`

## Estructura del Proyecto

```
src/
├── auth/          # Autenticación y autorización
├── stores/        # Gestión de tiendas
├── users/         # Gestión de usuarios
├── products/      # Gestión de productos
├── toppings/      # Gestión de toppings
├── orders/        # Gestión de pedidos
├── kitchen/       # Cola de cocina
├── payments/      # Gestión de pagos
└── reports/       # Reportes y estadísticas
```

## Endpoints Principales

### Autenticación
- `POST /auth/login` - Iniciar sesión
- `GET /auth/profile` - Obtener perfil actual

### Pedidos
- `POST /orders` - Crear pedido (Mesero)
- `GET /orders` - Listar pedidos
- `PATCH /orders/:id/status` - Actualizar estado

### Cocina
- `GET /kitchen/queue` - Ver cola de pedidos
- `PATCH /kitchen/queue/:id/start` - Iniciar preparación
- `PATCH /kitchen/queue/:id/complete` - Marcar como listo

## Roles del Sistema

- **Administrador**: Gestión completa de la tienda
- **Mesero**: Tomar pedidos
- **Cocina**: Gestionar cola de preparación

## Tecnologías

- NestJS
- TypeORM
- PostgreSQL
- JWT (Passport)
- TypeScript
# back_queuechef
