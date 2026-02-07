// Script temporal para probar la conexión a PostgreSQL
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { Client } = require('pg');

// Intentar usar DATABASE_URL si está disponible, sino usar parámetros individuales
const connectionConfig = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
} : {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '142536',
  database: process.env.DB_DATABASE || 'queuechef',
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false, // Render requiere SSL pero permite certificados autofirmados
  } : false,
};

const client = new Client(connectionConfig);

console.log('Intentando conectar con:');
if (process.env.DATABASE_URL) {
  console.log('Usando DATABASE_URL (URL completa)');
  const url = process.env.DATABASE_URL;
  // Ocultar la contraseña en el log
  const safeUrl = url.replace(/:[^:@]+@/, ':****@');
  console.log('URL:', safeUrl);
} else {
  console.log('Usando parámetros individuales:');
  console.log('Host:', process.env.DB_HOST || 'localhost');
  console.log('Port:', process.env.DB_PORT || '5432');
  console.log('User:', process.env.DB_USERNAME || 'postgres');
  console.log('Database:', process.env.DB_DATABASE || 'queuechef');
  console.log('Password:', process.env.DB_PASSWORD ? '***configurada***' : 'NO CONFIGURADA');
  console.log('SSL:', process.env.DB_SSL === 'true' ? 'Habilitado' : 'Deshabilitado');
}

client.connect()
  .then(() => {
    console.log('\n✅ ¡Conexión exitosa a PostgreSQL!');
    return client.query('SELECT version()');
  })
  .then((result) => {
    console.log('Versión de PostgreSQL:', result.rows[0].version);
    client.end();
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Error de conexión:');
    console.error(err.message);
    console.error('\nPosibles soluciones:');
    console.error('1. Verifica que PostgreSQL esté corriendo');
    console.error('2. Verifica el usuario y contraseña en el archivo .env');
    console.error('3. Verifica que la base de datos exista');
    console.error('4. Si usas autenticación por Windows, verifica pg_hba.conf');
    client.end();
    process.exit(1);
  });
