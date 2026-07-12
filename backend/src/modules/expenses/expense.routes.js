const { Router } = require('express');
const expenseController = require('./expense.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validation.middleware');
const { createExpenseSchema, updateExpenseSchema } = require('../../validations/expense.validation');

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     Expense:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6a53177aafeb0710b7498055
 *         vehicle:
 *           type: object
 *           properties:
 *             _id: { type: string }
 *             name: { type: string }
 *             registrationNumber: { type: string }
 *         trip:
 *           type: object
 *           nullable: true
 *           properties:
 *             _id: { type: string }
 *             source: { type: string }
 *             destination: { type: string }
 *         type:
 *           type: string
 *           enum: [fuel, toll, maintenance, parking, repair, miscellaneous]
 *           example: toll
 *         amount:
 *           type: number
 *           example: 350.00
 *         description:
 *           type: string
 *           example: Highway toll at NH-8
 *         date:
 *           type: string
 *           format: date-time
 *           example: "2026-07-10T14:00:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ExpenseAggregation:
 *       type: object
 *       properties:
 *         breakdown:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type: { type: string }
 *               totalAmount: { type: number }
 *               count: { type: integer }
 *         grandTotal:
 *           type: number
 *           example: 12500.00
 */

// POST /api/expenses

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     tags: [Expenses]
 *     summary: Log a new expense
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicle, type, amount]
 *             properties:
 *               vehicle:
 *                 type: string
 *                 example: 6a53177aafeb0710b7498011
 *               trip:
 *                 type: string
 *                 nullable: true
 *                 example: 6a53177aafeb0710b7498022
 *               type:
 *                 type: string
 *                 enum: [fuel, toll, maintenance, parking, repair, miscellaneous]
 *                 example: toll
 *               amount:
 *                 type: number
 *                 minimum: 0
 *                 example: 350.00
 *               description:
 *                 type: string
 *                 example: Highway toll at NH-8
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Expense logged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     expense: { $ref: '#/components/schemas/Expense' }
 */
router.post('/', authorize('admin', 'fleet_manager'), validate(createExpenseSchema), expenseController.create);

// GET /api/expenses/vehicle/:vehicleId  (before /:id)

/**
 * @swagger
 * /api/expenses/vehicle/{vehicleId}:
 *   get:
 *     tags: [Expenses]
 *     summary: Aggregate expenses by vehicle
 *     description: Returns total expenses grouped by type for a vehicle.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Aggregated expense data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/ExpenseAggregation' }
 */
router.get('/vehicle/:vehicleId', expenseController.aggregateByVehicle);

// GET /api/expenses/trip/:tripId

/**
 * @swagger
 * /api/expenses/trip/{tripId}:
 *   get:
 *     tags: [Expenses]
 *     summary: Aggregate expenses by trip
 *     description: Returns total expenses grouped by type for a trip.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: tripId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Aggregated expense data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data: { $ref: '#/components/schemas/ExpenseAggregation' }
 */
router.get('/trip/:tripId', expenseController.aggregateByTrip);

// GET /api/expenses

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     tags: [Expenses]
 *     summary: List all expenses
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: vehicle
 *         schema: { type: string }
 *       - in: query
 *         name: trip
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [fuel, toll, maintenance, parking, repair, miscellaneous] }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: sort
 *         schema: { type: string, default: "-date" }
 *     responses:
 *       200:
 *         description: Paginated expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     expenses:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Expense' }
 *                     pagination: { $ref: '#/components/schemas/DriverPagination' }
 */
router.get('/', expenseController.findAll);

// GET /api/expenses/:id

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     tags: [Expenses]
 *     summary: Get a single expense by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Expense data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     expense: { $ref: '#/components/schemas/Expense' }
 */
router.get('/:id', expenseController.findById);

// PATCH /api/expenses/:id

/**
 * @swagger
 * /api/expenses/{id}:
 *   patch:
 *     tags: [Expenses]
 *     summary: Update an expense entry
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               vehicle: { type: string }
 *               trip: { type: string, nullable: true }
 *               type: { type: string, enum: [fuel, toll, maintenance, parking, repair, miscellaneous] }
 *               amount: { type: number, minimum: 0 }
 *               description: { type: string }
 *               date: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: Expense updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 data:
 *                   type: object
 *                   properties:
 *                     expense: { $ref: '#/components/schemas/Expense' }
 */
router.patch('/:id', authorize('admin', 'fleet_manager'), validate(updateExpenseSchema), expenseController.update);

// DELETE /api/expenses/:id

/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     tags: [Expenses]
 *     summary: Delete an expense entry
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Expense deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: Expense deleted successfully }
 */
router.delete('/:id', authorize('admin'), expenseController.remove);

module.exports = router;
