const { Router } = require('express');
const vehicleController = require('./vehicle.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validation.middleware');
const {
    createVehicleSchema,
    updateVehicleSchema,
    updateStatusSchema,
    listVehiclesQuerySchema
} = require('../../validations/vehicle.validation');

const router = Router();

// All vehicle routes require authentication
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     Vehicle:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6a5317b4afeb0710b7498100
 *         registrationNumber:
 *           type: string
 *           example: ABC-1234
 *         name:
 *           type: string
 *           example: Freightliner Cascadia
 *         type:
 *           type: string
 *           enum: [Truck, Van, Pickup, Trailer, Bus, Car, Other]
 *           example: Truck
 *         maxLoadCapacity:
 *           type: number
 *           example: 24000
 *         odometer:
 *           type: number
 *           example: 152000
 *         acquisitionCost:
 *           type: number
 *           example: 85000
 *         status:
 *           type: string
 *           enum: [Available, On Trip, In Shop, Retired]
 *           example: Available
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     VehicleList:
 *       type: object
 *       properties:
 *         vehicles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Vehicle'
 *         total:
 *           type: number
 *           example: 42
 *         page:
 *           type: number
 *           example: 1
 *         totalPages:
 *           type: number
 *           example: 3
 *     VehicleStats:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *           example: 42
 *         byStatus:
 *           type: object
 *           properties:
 *             Available:
 *               type: number
 *               example: 28
 *             On Trip:
 *               type: number
 *               example: 8
 *             In Shop:
 *               type: number
 *               example: 4
 *             Retired:
 *               type: number
 *               example: 2
 */

// ── Stats (must be before /:id to avoid route conflict) ────────────

/**
 * @swagger
 * /api/vehicles/stats:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get vehicle fleet statistics
 *     description: Returns total vehicle count and counts grouped by status. Useful for dashboard cards.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Fleet statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VehicleStats'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', vehicleController.stats);

// ── List all vehicles ───────────────────────────────────────────────

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     tags: [Vehicles]
 *     summary: List all vehicles
 *     description: >
 *       Returns a paginated, filterable list of vehicles.
 *       Supports filtering by status and type, plus free-text search across name and registration number.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: '-createdAt'
 *         description: "Sort field. Prefix with - for descending. Options: name, registrationNumber, type, status, odometer, acquisitionCost, createdAt"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Available, On Trip, In Shop, Retired]
 *         description: Filter by vehicle status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Truck, Van, Pickup, Trailer, Bus, Car, Other]
 *         description: Filter by vehicle type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Free-text search across name and registration number
 *     responses:
 *       200:
 *         description: Paginated list of vehicles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/VehicleList'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', validate(listVehiclesQuerySchema, 'query'), vehicleController.list);

// ── Create vehicle ──────────────────────────────────────────────────

/**
 * @swagger
 * /api/vehicles:
 *   post:
 *     tags: [Vehicles]
 *     summary: Register a new vehicle
 *     description: Creates a new vehicle in the fleet. Restricted to admin and fleet_manager roles.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [registrationNumber, name, type, maxLoadCapacity, acquisitionCost]
 *             properties:
 *               registrationNumber:
 *                 type: string
 *                 example: ABC-1234
 *               name:
 *                 type: string
 *                 example: Freightliner Cascadia
 *               type:
 *                 type: string
 *                 enum: [Truck, Van, Pickup, Trailer, Bus, Car, Other]
 *                 example: Truck
 *               maxLoadCapacity:
 *                 type: number
 *                 example: 24000
 *               odometer:
 *                 type: number
 *                 example: 152000
 *               acquisitionCost:
 *                 type: number
 *                 example: 85000
 *               status:
 *                 type: string
 *                 enum: [Available, On Trip, In Shop, Retired]
 *                 default: Available
 *     responses:
 *       201:
 *         description: Vehicle created successfully
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
 *                   example: Vehicle created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicle:
 *                       $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — insufficient role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Registration number already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    '/',
    authorize('admin', 'fleet_manager'),
    validate(createVehicleSchema),
    vehicleController.create
);

// ── Get single vehicle ──────────────────────────────────────────────

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     tags: [Vehicles]
 *     summary: Get vehicle by ID
 *     description: Returns a single vehicle by its MongoDB ID.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle MongoDB _id
 *     responses:
 *       200:
 *         description: Vehicle found
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
 *                     vehicle:
 *                       $ref: '#/components/schemas/Vehicle'
 *       401:
 *         description: Unauthorized
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
router.get('/:id', vehicleController.getById);

// ── Update vehicle ──────────────────────────────────────────────────

/**
 * @swagger
 * /api/vehicles/{id}:
 *   put:
 *     tags: [Vehicles]
 *     summary: Update vehicle details
 *     description: Updates fields on an existing vehicle. At least one field must be provided. Restricted to admin and fleet_manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle MongoDB _id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               registrationNumber:
 *                 type: string
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Truck, Van, Pickup, Trailer, Bus, Car, Other]
 *               maxLoadCapacity:
 *                 type: number
 *               odometer:
 *                 type: number
 *               acquisitionCost:
 *                 type: number
 *               status:
 *                 type: string
 *                 enum: [Available, On Trip, In Shop, Retired]
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
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
 *                   example: Vehicle updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicle:
 *                       $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — insufficient role
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
router.put(
    '/:id',
    authorize('admin', 'fleet_manager'),
    validate(updateVehicleSchema),
    vehicleController.update
);

// ── Update vehicle status ───────────────────────────────────────────

/**
 * @swagger
 * /api/vehicles/{id}/status:
 *   patch:
 *     tags: [Vehicles]
 *     summary: Update vehicle status
 *     description: >
 *       Changes the vehicle's operational status with business-rule validation.
 *       Allowed transitions: Available→On Trip, Available→In Shop, Available→Retired,
 *       On Trip→Available, On Trip→Retired, In Shop→Available, In Shop→Retired.
 *       Retired vehicles cannot be reactivated. Vehicles with active trips cannot be retired.
 *       Restricted to admin and fleet_manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle MongoDB _id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [Available, On Trip, In Shop, Retired]
 *                 example: In Shop
 *     responses:
 *       200:
 *         description: Status updated successfully
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
 *                   example: Vehicle status changed to 'In Shop'
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicle:
 *                       $ref: '#/components/schemas/Vehicle'
 *       400:
 *         description: Invalid transition or validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — insufficient role
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
router.patch(
    '/:id/status',
    authorize('admin', 'fleet_manager'),
    validate(updateStatusSchema),
    vehicleController.updateStatus
);

// ── Delete vehicle ──────────────────────────────────────────────────

/**
 * @swagger
 * /api/vehicles/{id}:
 *   delete:
 *     tags: [Vehicles]
 *     summary: Delete a vehicle
 *     description: >
 *       Permanently removes a vehicle from the fleet. Safety check: vehicles with active
 *       (Draft or Dispatched) trips cannot be deleted. Restricted to admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle MongoDB _id
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
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
 *                   example: Vehicle deleted successfully
 *       400:
 *         description: Cannot delete — active trips exist
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — insufficient role
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
router.delete(
    '/:id',
    authorize('admin'),
    vehicleController.remove
);

module.exports = router;
