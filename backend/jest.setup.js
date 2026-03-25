/**
 * Jest Setup File
 *
 * Se ejecuta ANTES de cada suite de tests.
 * Configura variables de entorno de prueba para que los módulos
 * no lancen errores al importarse (TokenService, database, etc.)
 */
process.env.JWT_SECRET = 'test-jwt-secret-key-not-for-production';
process.env.JWT_ACCESS_EXPIRES = '15m';
process.env.JWT_REFRESH_EXPIRES = '7d';
process.env.DB_PASSWORD = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test';
process.env.DB_NAME = 'test';
