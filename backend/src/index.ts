import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';

import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';

import authRoutes from './features/auth/auth.routes';
import usersRoutes from './features/users/users.routes';
import rolesRoutes from './features/roles/roles.routes';
import { seedDefaultRoles } from './services/roleSeed.service';

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
app.use(cookieParser());

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Swagger API Documentation Endpoints
app.get('/docs', (_req: Request, res: Response) => res.redirect('/api-docs/'));
app.get('/api-docs', (req: Request, res: Response, next) => {
  if (!req.originalUrl.endsWith('/')) {
    return res.redirect(301, `${req.originalUrl}/`);
  }
  next();
});
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Textiles L&M - Documentación API',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  })
);
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.json(swaggerSpec);
});

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
app.use('/api/v1/roles', rolesRoutes);

// Global Error Handler
app.use(errorHandler);

// Start Server
const server = app.listen(env.PORT, async () => {
  console.log(`
  🚀 Server Textiles L&M API is running!
  📡 URL: http://localhost:${env.PORT}
  📖 Swagger Docs: http://localhost:${env.PORT}/api-docs
  🛠️ Environment: ${env.NODE_ENV}
  🔒 Authentication: JWT Enabled
  📊 Database: Supabase PostgreSQL Ready
  `);

  // Ensure default roles exist in database
  await seedDefaultRoles();
});

export default app;
