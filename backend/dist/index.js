"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const helmet_1 = __importDefault(require("helmet"));
const env_1 = require("./config/env");
const error_middleware_1 = require("./middlewares/error.middleware");
const auth_routes_1 = __importDefault(require("./features/auth/auth.routes"));
const users_routes_1 = __importDefault(require("./features/users/users.routes"));
const tasks_routes_1 = __importDefault(require("./features/tasks/tasks.routes"));
const app = (0, express_1.default)();
// Global Middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
if (env_1.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
// Health Check Endpoint
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'online',
        timestamp: new Date().toISOString(),
        service: 'Textiles L&M - Backend API (Feature-Based Architecture)',
        database: 'Supabase PostgreSQL',
    });
});
// Feature API Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/users', users_routes_1.default);
app.use('/api/v1/tasks', tasks_routes_1.default);
// Global Error Handler
app.use(error_middleware_1.errorHandler);
// Start Server
const server = app.listen(env_1.env.PORT, () => {
    console.log(`
  🚀 Server Textiles L&M API is running!
  📡 URL: http://localhost:${env_1.env.PORT}
  🛠️ Environment: ${env_1.env.NODE_ENV}
  🔒 Authentication: JWT Enabled
  📊 Database: Supabase PostgreSQL Ready
  `);
});
exports.default = app;
