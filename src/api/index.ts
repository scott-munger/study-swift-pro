import { startServer } from './server';

// Laisser .env fournir les variables (DATABASE_URL, PORT, etc.)
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

startServer();

