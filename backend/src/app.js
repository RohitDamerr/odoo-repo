require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./docs/swagger');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/error.middleware');
const ApiError = require('./errors/ApiError');

// ── Route imports ──────────────────────────────────────────────────
const authRoutes = require('./modules/auth/auth.routes');
const driverRoutes = require('./modules/drivers/driver.routes');
const fuelRoutes = require('./modules/fuel/fuel.routes');
const vehicleRoutes = require('./modules/vehicles/vehicle.routes');
const maintenanceRoutes = require('./modules/maintenance/maintenance.routes');

// ── Initialize express ─────────────────────────────────────────────
const app = express();

// ── Connect to MongoDB ─────────────────────────────────────────────
connectDB();

// ── Global middleware ──────────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS
app.use(
    cors({
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        credentials: true
    })
);

// Request logging
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Compression
app.use(compression());

// ── Health check ───────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'TransitOps API is running',
        timestamp: new Date().toISOString()
    });
});

// ── Swagger Docs ───────────────────────────────────────────────────
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'TransitOps API Docs'
}));

// Serve the raw spec as JSON for tooling
app.get('/api/docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpecs);
});

// ── API Routes ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// ── 404 handler — catch unmatched routes ───────────────────────────
app.use((_req, _res, next) => {
    next(ApiError.notFound(`Route ${_req.method} ${_req.originalUrl} not found`));
});

// ── Global error handler ───────────────────────────────────────────
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`TransitOps server running on port ${PORT} [${process.env.NODE_ENV}]`);
    });
}

module.exports = app;
