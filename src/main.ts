import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar .env antes de cualquier otra importación
config({ path: resolve(__dirname, '../.env') });

// Configurar zona horaria de Colombia antes de cualquier otra cosa
process.env.TZ = 'America/Bogota';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS con configuración explícita
  app.enableCors({
    origin: true, // Permitir todos los orígenes en desarrollo
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
      // Middleware de logging para todas las peticiones
      app.use((req, res, next) => {
        console.log(`\n=== REQUEST ===`);
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        console.log(`Path: ${req.path}`);
        console.log(`Original URL: ${req.originalUrl}`);
        if (req.body) {
          console.log('Body:', JSON.stringify(req.body, null, 2));
        }
        next();
      });

  // Validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Aplicación ejecutándose en: http://localhost:${port}`);
}

bootstrap();
