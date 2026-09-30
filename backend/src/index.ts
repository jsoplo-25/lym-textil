import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

import authRoutes from './features/auth/auth.routes';
import usersRoutes from './features/users/users.routes';
import tasksRoutes from './features/tasks/tasks.routes';

const app: Express = express();

// Global Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  })
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Swagger API Documentation Endpoint
app.use('/api-docs', swaggerUi.serveFiles(swaggerSpec), swaggerUi.setup(swaggerSpec));
app.get('/docs', (_req: Request, res: Response) => res.redirect('/api-docs/'));

// Health Check Endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Textiles L&M - Backend API (Feature-Based Architecture)',
    database: 'Supabase PostgreSQL',
    documentation: 'http://localhost:4000/api-docs',
  });
});

// Feature API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/tasks', tasksRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(env.PORT, () => {
  console.log(`
  🚀 Server Textiles L&M API is running!
  📡 URL: http://localhost:${env.PORT}
  📖 Swagger Docs: http://localhost:${env.PORT}/api-docs
  🛠️ Environment: ${env.NODE_ENV}
  🔒 Authentication: JWT Enabled
  📊 Database: Supabase PostgreSQL Ready
  `);
});

export default app;
