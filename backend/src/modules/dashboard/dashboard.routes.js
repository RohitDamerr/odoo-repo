const { Router } = require('express');
const dashboardController = require('./dashboard.controller');
const authenticate = require('../../middleware/auth.middleware');

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/kpis:
 *   get:
 *     tags: [Dashboard]
 *     summary: Dashboard KPIs
 *     description: >
 *       Returns all dashboard KPIs in one payload — fleet stats, driver stats,
 *       active/pending trips, maintenance/fuel/expense costs for the period.
 *       Defaults to current month. Supports `?startDate=` and `?endDate=` for custom ranges.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Dashboard KPI payload
 */
router.get('/kpis', dashboardController.getKPIs);

module.exports = router;
