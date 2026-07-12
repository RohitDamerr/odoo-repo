const { Router } = require('express');
const reportController = require('./report.controller');
const authenticate = require('../../middleware/auth.middleware');

const router = Router();

// All report routes require authentication
router.use(authenticate);

/**
 * Shared query parameters for all report endpoints.
 *
 * @swagger
 * components:
 *   parameters:
 *     formatParam:
 *       in: query
 *       name: format
 *       schema:
 *         type: string
 *         enum: [json, csv, excel, pdf]
 *         default: json
 *       description: |
 *         Response format:
 *         - **json** (default) — JSON payload
 *         - **csv** — UTF-8 CSV with BOM (opens correctly in Excel)
 *         - **excel** — .xlsx workbook with styled headers
 *         - **pdf** — landscape PDF with table layout
 *     startDateParam:
 *       in: query
 *       name: startDate
 *       schema:
 *         type: string
 *         format: date
 *       description: Filter from date (ISO, e.g. 2026-01-01)
 *     endDateParam:
 *       in: query
 *       name: endDate
 *       schema:
 *         type: string
 *         format: date
 *       description: Filter to date (ISO, e.g. 2026-07-31)
 */

// ═══════════════════════════════════════════════════════════════════
//  VEHICLE REPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/reports/vehicles/overview:
 *   get:
 *     tags: [Reports]
 *     summary: Fleet overview report
 *     description: >
 *       Returns total vehicle count, breakdown by status and type, and odometer
 *       summary. Append `?format=csv`, `?format=excel`, or `?format=pdf` to
 *       download as a file.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/formatParam'
 *     responses:
 *       200:
 *         description: Fleet overview (JSON or file download)
 */
router.get('/vehicles/overview', reportController.vehicleOverview);

/**
 * @swagger
 * /api/reports/vehicles/value:
 *   get:
 *     tags: [Reports]
 *     summary: Fleet value report
 *     description: >
 *       Returns total acquisition cost, average cost per vehicle, and cost
 *       breakdown by type.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/formatParam'
 *     responses:
 *       200:
 *         description: Fleet value data
 */
router.get('/vehicles/value', reportController.vehicleValue);

// ═══════════════════════════════════════════════════════════════════
//  DRIVER REPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/reports/drivers/overview:
 *   get:
 *     tags: [Reports]
 *     summary: Driver workforce overview
 *     description: >
 *       Returns total driver count, breakdown by status, and safety score
 *       statistics.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/formatParam'
 *     responses:
 *       200:
 *         description: Driver overview data
 */
router.get('/drivers/overview', reportController.driverOverview);

/**
 * @swagger
 * /api/reports/drivers/license-expiry:
 *   get:
 *     tags: [Reports]
 *     summary: License expiry report
 *     description: >
 *       Categorises all drivers by license expiration: expired, within 30d,
 *       60d, 90d, and valid. Includes full driver details per bucket.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/formatParam'
 *     responses:
 *       200:
 *         description: License expiry breakdown
 */
router.get('/drivers/license-expiry', reportController.driverLicenseExpiry);

// ═══════════════════════════════════════════════════════════════════
//  FUEL REPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/reports/fuel/summary:
 *   get:
 *     tags: [Reports]
 *     summary: Fuel consumption summary
 *     description: >
 *       Returns total liters, total cost, average cost per liter, and per-vehicle
 *       breakdown. Supports date range filtering.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/formatParam'
 *       - $ref: '#/components/parameters/startDateParam'
 *       - $ref: '#/components/parameters/endDateParam'
 *     responses:
 *       200:
 *         description: Fuel summary report
 */
router.get('/fuel/summary', reportController.fuelSummary);

/**
 * @swagger
 * /api/reports/fuel/efficiency:
 *   get:
 *     tags: [Reports]
 *     summary: Fuel efficiency report
 *     description: >
 *       Calculates km/L efficiency per vehicle using odometer readings from
 *       fuel logs. Requires at least 2 odometer data points per vehicle.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/formatParam'
 *       - $ref: '#/components/parameters/startDateParam'
 *       - $ref: '#/components/parameters/endDateParam'
 *     responses:
 *       200:
 *         description: Per-vehicle fuel efficiency
 */
router.get('/fuel/efficiency', reportController.fuelEfficiency);

// ═══════════════════════════════════════════════════════════════════
//  MAINTENANCE REPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/reports/maintenance/summary:
 *   get:
 *     tags: [Reports]
 *     summary: Maintenance summary report
 *     description: >
 *       Returns total/active/closed job counts, total and average cost, and
 *       breakdown by maintenance type.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/formatParam'
 *       - $ref: '#/components/parameters/startDateParam'
 *       - $ref: '#/components/parameters/endDateParam'
 *     responses:
 *       200:
 *         description: Maintenance summary data
 */
router.get('/maintenance/summary', reportController.maintenanceSummary);

/**
 * @swagger
 * /api/reports/maintenance/cost-by-vehicle:
 *   get:
 *     tags: [Reports]
 *     summary: Maintenance cost by vehicle
 *     description: >
 *       Groups maintenance costs by vehicle, sorted by total cost descending.
 *       Shows job count and average cost per job.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/formatParam'
 *       - $ref: '#/components/parameters/startDateParam'
 *       - $ref: '#/components/parameters/endDateParam'
 *     responses:
 *       200:
 *         description: Per-vehicle maintenance cost breakdown
 */
router.get('/maintenance/cost-by-vehicle', reportController.maintenanceCostByVehicle);

/**
 * @swagger
 * /api/reports/maintenance/downtime:
 *   get:
 *     tags: [Reports]
 *     summary: Vehicle downtime report
 *     description: >
 *       Calculates total days each vehicle spent in maintenance (Closed jobs
 *       only). Includes per-job breakdown and grand totals.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/formatParam'
 *       - $ref: '#/components/parameters/startDateParam'
 *       - $ref: '#/components/parameters/endDateParam'
 *     responses:
 *       200:
 *         description: Per-vehicle downtime data with job details
 */
router.get('/maintenance/downtime', reportController.maintenanceDowntime);

// ═══════════════════════════════════════════════════════════════════
//  TRIP REPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/reports/trips/summary:
 *   get:
 *     tags: [Reports]
 *     summary: Trip summary report
 *     description: Total trips, breakdown by status, revenue, and per-vehicle trip counts.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/formatParam'
 *       - $ref: '#/components/parameters/startDateParam'
 *       - $ref: '#/components/parameters/endDateParam'
 *     responses:
 *       200:
 *         description: Trip summary data
 */
router.get('/trips/summary', reportController.tripSummary);

/**
 * @swagger
 * /api/reports/trips/revenue:
 *   get:
 *     tags: [Reports]
 *     summary: Trip revenue report
 *     description: Completed trip revenue details with per-trip breakdown.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/formatParam'
 *       - $ref: '#/components/parameters/startDateParam'
 *       - $ref: '#/components/parameters/endDateParam'
 *     responses:
 *       200:
 *         description: Trip revenue breakdown
 */
router.get('/trips/revenue', reportController.tripRevenue);

// ═══════════════════════════════════════════════════════════════════
//  EXPENSE REPORTS
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/reports/expenses/summary:
 *   get:
 *     tags: [Reports]
 *     summary: Expense summary report
 *     description: Total expenses, by-type breakdown, and per-vehicle cost.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/formatParam'
 *       - $ref: '#/components/parameters/startDateParam'
 *       - $ref: '#/components/parameters/endDateParam'
 *     responses:
 *       200:
 *         description: Expense summary with by-type and by-vehicle breakdown
 */
router.get('/expenses/summary', reportController.expenseSummary);

// ═══════════════════════════════════════════════════════════════════
//  ROI & UTILIZATION
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/reports/vehicles/roi:
 *   get:
 *     tags: [Reports]
 *     summary: Vehicle ROI report
 *     description: >
 *       Calculates ROI per vehicle: ((Revenue - (Maintenance + Fuel + Other Expenses)) / AcquisitionCost) × 100.
 *       Sorted by ROI descending.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/formatParam'
 *     responses:
 *       200:
 *         description: Per-vehicle ROI data
 */
router.get('/vehicles/roi', reportController.vehicleROI);

/**
 * @swagger
 * /api/reports/vehicles/utilization:
 *   get:
 *     tags: [Reports]
 *     summary: Fleet utilization report
 *     description: >
 *       Percentage of active fleet that completed at least one trip in the period.
 *       Includes per-vehicle trip counts and distance.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/formatParam'
 *       - $ref: '#/components/parameters/startDateParam'
 *       - $ref: '#/components/parameters/endDateParam'
 *     responses:
 *       200:
 *         description: Fleet utilization metrics
 */
router.get('/vehicles/utilization', reportController.fleetUtilization);

module.exports = router;
