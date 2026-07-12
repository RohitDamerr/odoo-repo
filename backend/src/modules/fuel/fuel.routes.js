const { Router } = require('express');
const fuelController = require('./fuel.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validation.middleware');
const {
    createFuelSchema,
    updateFuelSchema
} = require('../../validations/fuel.validation');

const router = Router();

//  All routes require a valid JWT
router.use(authenticate);

//  Swagger Schema — FuelLog

/**
 * @swagger
 * components:
 *   schemas:
 *     FuelLog:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6a53177aafeb0710b7498044
 *         vehicle:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             registrationNumber:
 *               type: string
 *             type:
 *               type: string
 *         trip:
 *           type: object
 *           nullable: true
 *           properties:
 *             _id:
 *               type: string
 *             source:
 *               type: string
 *             destination:
 *               type: string
 *             status:
 *               type: string
 *         liters:
 *           type: number
 *           example: 45.5
 *         cost:
 *           type: number
 *           example: 4550.00
 *         odometer:
 *           type: number
 *           nullable: true
 *           example: 125000
 *         date:
 *           type: string
 *           format: date-time
 *           example: "2026-07-10T08:30:00.000Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     FuelEfficiency:
 *       type: object
 *       properties:
 *         totalLiters:
 *           type: number
 *           example: 245.50
 *         totalDistance:
 *           type: number
 *           example: 2150
 *         efficiency:
 *           type: number
 *           nullable: true
 *           example: 8.76
 *         transactionCount:
 *           type: integer
 *           example: 5
 */

//  POST /api/v1/fuel

/**
 * @swagger
 * /api/v1/fuel:
 *   post:
 *     tags: [Fuel]
 *     summary: Log a fuel transaction
 *     description: >
 *       Records a fuel purchase for a vehicle, optionally linked to a trip.
 *       The odometer reading enables fuel efficiency (km/L) calculations.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicle, liters, cost]
 *             properties:
 *               vehicle:
 *                 type: string
 *                 description: Vehicle ID
 *                 example: 6a53177aafeb0710b7498011
 *               trip:
 *                 type: string
 *                 nullable: true
 *                 description: Optional trip ID
 *                 example: 6a53177aafeb0710b7498022
 *               liters:
 *                 type: number
 *                 minimum: 0
 *                 example: 45.5
 *               cost:
 *                 type: number
 *                 minimum: 0
 *                 example: 4550.00
 *               odometer:
 *                 type: number
 *                 minimum: 0
 *                 nullable: true
 *                 description: Vehicle odometer reading at fill-up
 *                 example: 125000
 *               date:
 *                 type: string
 *                 format: date-time
 *                 default: now
 *                 example: "2026-07-10T08:30:00.000Z"
 *     responses:
 *       201:
 *         description: Fuel transaction logged
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     fuelLog:
 *                       $ref: '#/components/schemas/FuelLog'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Vehicle or trip not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    '/',
    authorize('admin', 'fleet_manager'),
    validate(createFuelSchema),
    fuelController.create
);

//  GET /api/v1/fuel/efficiency/:vehicleId   (MUST be before /:id)

/**
 * @swagger
 * /api/v1/fuel/efficiency/{vehicleId}:
 *   get:
 *     tags: [Fuel]
 *     summary: Calculate fuel efficiency for a vehicle
 *     description: >
 *       Returns fuel efficiency (km/L) for a vehicle over an optional date range.
 *       Uses odometer readings from consecutive fuel logs to estimate distance.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle ID
 *         example: 6a53177aafeb0710b7498011
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (inclusive)
 *         example: "2026-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (inclusive)
 *         example: "2026-07-12"
 *     responses:
 *       200:
 *         description: Fuel efficiency data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FuelEfficiency'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Vehicle not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/efficiency/:vehicleId', fuelController.getEfficiency);

//  GET /api/v1/fuel

/**
 * @swagger
 * /api/v1/fuel:
 *   get:
 *     tags: [Fuel]
 *     summary: List all fuel logs
 *     description: Returns paginated fuel logs with vehicle and trip populated.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vehicle
 *         schema:
 *           type: string
 *         description: Filter by vehicle ID
 *       - in: query
 *         name: trip
 *         schema:
 *           type: string
 *         description: Filter by trip ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter from date (inclusive)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter to date (inclusive)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "-date"
 *         description: Sort field (prefix with `-` for descending)
 *     responses:
 *       200:
 *         description: Paginated list of fuel logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     fuelLogs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FuelLog'
 *                     pagination:
 *                       $ref: '#/components/schemas/DriverPagination'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', fuelController.findAll);

//  GET /api/v1/fuel/:id

/**
 * @swagger
 * /api/v1/fuel/{id}:
 *   get:
 *     tags: [Fuel]
 *     summary: Get a single fuel log by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Fuel log ID
 *     responses:
 *       200:
 *         description: Fuel log data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     fuelLog:
 *                       $ref: '#/components/schemas/FuelLog'
 *       401:
 *         description: Missing or invalid access token
 *       404:
 *         description: Fuel log not found
 */
router.get('/:id', fuelController.findById);

//  PATCH /api/v1/fuel/:id

/**
 * @swagger
 * /api/v1/fuel/{id}:
 *   patch:
 *     tags: [Fuel]
 *     summary: Update a fuel log entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Fuel log ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               vehicle:
 *                 type: string
 *               trip:
 *                 type: string
 *                 nullable: true
 *               liters:
 *                 type: number
 *                 minimum: 0
 *               cost:
 *                 type: number
 *                 minimum: 0
 *               odometer:
 *                 type: number
 *                 minimum: 0
 *                 nullable: true
 *               date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Fuel log updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     fuelLog:
 *                       $ref: '#/components/schemas/FuelLog'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Missing or invalid access token
 *       404:
 *         description: Fuel log, vehicle, or trip not found
 */
router.patch(
    '/:id',
    authorize('admin', 'fleet_manager'),
    validate(updateFuelSchema),
    fuelController.update
);

//  DELETE /api/v1/fuel/:id

/**
 * @swagger
 * /api/v1/fuel/{id}:
 *   delete:
 *     tags: [Fuel]
 *     summary: Delete a fuel log entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Fuel log ID
 *     responses:
 *       200:
 *         description: Fuel log deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Fuel log deleted successfully
 *       401:
 *         description: Missing or invalid access token
 *       404:
 *         description: Fuel log not found
 */
router.delete('/:id', authorize('admin'), fuelController.remove);

module.exports = router;
