"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middlewares/error.middleware");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_1 = require("./config/swagger");
const auth_routes_1 = __importDefault(require("./features/auth/auth.routes"));
const users_routes_1 = __importDefault(require("./features/users/users.routes"));
const roles_routes_1 = __importDefault(require("./features/roles/roles.routes"));
const machines_routes_1 = __importDefault(require("./features/machines/machines.routes"));
const suppliers_routes_1 = __importDefault(require("./features/suppliers/suppliers.routes"));
const production_routes_1 = __importDefault(require("./features/production/production.routes"));
const dashboard_routes_1 = __importDefault(require("./features/dashboard/dashboard.routes"));
const roleSeed_service_1 = require("./services/roleSeed.service");
const app = (0, express_1.default)();
// Global Middlewares
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
}));
// Dynamic CORS configuration (supports comma-separated list of origins or wildcard)
const allowedOrigins = env_1.env.FRONTEND_URL === '*'
    ? '*'
    : env_1.env.FRONTEND_URL.split(',').map((origin) => origin.trim());
app.use((0, cors_1.default)({
    origin: allowedOrigins === '*' ? true : (origin, callback) => {
        if (!origin || (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin))) {
            callback(null, true);
        }
        else {
            callback(null, true); // Permissive fallback or restrict as needed
        }
    },
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
if (env_1.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
// Swagger API Documentation Endpoints
app.get('/docs', (_req, res) => res.redirect('/api-docs/'));
app.get('/api-docs', (req, res, next) => {
    if (!req.originalUrl.endsWith('/')) {
        return res.redirect(301, `${req.originalUrl}/`);
    }
    next();
});
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_1.swaggerSpec, {
    customSiteTitle: 'Textiles L&M - Documentación API',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
    },
}));
app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json(swagger_1.swaggerSpec);
});
// Root Welcome Endpoint
app.get('/', (_req, res) => {
    res.status(200).json({
        message: '🚀 API de Textiles L&M funcionando correctamente',
        status: 'online',
        documentation: `${env_1.env.API_URL}/api-docs`,
        health: `${env_1.env.API_URL}/health`,
        environment: env_1.env.NODE_ENV,
    });
});
// Health Check Endpoint (Render uses this for zero-downtime and liveness checks)
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'online',
        timestamp: new Date().toISOString(),
        service: 'Textiles L&M - Backend API (Feature-Based Architecture)',
        environment: env_1.env.NODE_ENV,
        database: 'Supabase PostgreSQL',
        documentation: `${env_1.env.API_URL}/api-docs`,
    });
});
// Feature API Routes (Rutas directas sin versionamiento)
app.use('/auth', auth_routes_1.default);
app.use('/users', users_routes_1.default);
app.use('/roles', roles_routes_1.default);
app.use('/machines', machines_routes_1.default);
app.use('/suppliers', suppliers_routes_1.default);
app.use('/production', production_routes_1.default);
app.use('/dashboard', dashboard_routes_1.default);
// Soporte opcional para prefijo /api
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', users_routes_1.default);
app.use('/api/roles', roles_routes_1.default);
app.use('/api/machines', machines_routes_1.default);
app.use('/api/suppliers', suppliers_routes_1.default);
app.use('/api/production', production_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// Global Error Handler
app.use(error_middleware_1.errorHandler);
// Start Server
app.listen(env_1.env.PORT, async () => {
    console.log(`
  🚀 Server Textiles L&M API is running!
  📡 URL: http://localhost:${env_1.env.PORT}
  📖 Swagger Docs: http://localhost:${env_1.env.PORT}/api-docs
  🛠️ Environment: ${env_1.env.NODE_ENV}
  🔒 Authentication: JWT Enabled
  📊 Database: Supabase PostgreSQL Ready
  `);
    // Ensure default roles exist in database
    await (0, roleSeed_service_1.seedDefaultRoles)();
});
exports.default = app;
