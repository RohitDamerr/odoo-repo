const { Router } = require('express');
const tripController = require('./trip.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validation.middleware');
const { createTripSchema, updateTripSchema, completeTripSchema } = require('../../validations/trip.validation');

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     Trip:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6a53177aafeb0710b7498066
 *         source:
 *           type: string
 *           example: Mumbai
 *         destination:
 *           type: string
 *           example: Pune
 *         vehicle:
 *           type: object
 *           properties:
 *             _id: { type: string }
 *             name: { type: string }
 *             registrationNumber: { type: string }
 *             status: { type: string }
 *         driver:
 *           type: object
 *           properties:
 *             _id: { type: string }
 *             name: { type: string }
 *             licenseNumber: { type: string }
 *             status: { type: string }
 *         cargoWeight:
 *           type: number
 *           example: 450
 *         plannedDistance:
 *           type: number
 *           example: 160
 *         actualOdometer:
 *           type: number
 *           nullable: true
 *           example: 175
 *         fuelConsumed:
 *           type: number
 *           nullable: true
 *           example: 14.5
 *         revenue:
 *           type: number
 *           example: 12000.00
 *         status:
 *           type: string
 *           enum: [Draft, Dispatched, Completed, Cancelled]
 *           example: Draft
 *         dispatchedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 */

// POST /api/v1/trips

/**
 * @swagger
 * /api/v1/trips:
 *   post:
 *     tags: [Trips]
 *     summary: Create a new trip (Draft)
 *     description: >
 *       Creates a trip in Draft status. Validates that cargo weight does not
 *       exceed the vehicle's maximum load capacity.
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [source, destination, vehicle, driver, cargoWeight, plannedDistance]
 *             properties:
 *               source: { type: string, example: Mumbai }
 *               destination: { type: string, example: Pune }
 *               vehicle: { type: string, example: "6a53177aafeb0710b7498011" }
 *               driver: { type: string, example: "6a53177aafeb0710b7498033" }
 *               cargoWeight: { type: number, minimum: 0, example: 450 }
 *               plannedDistance: { type: number, minimum: 0, example: 160 }
 *               revenue: { type: number, minimum: 0, default: 0, example: 12000 }
 *     responses:
 *       201:
 *         description: Trip created
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
 *                     trip: { $ref: '#/components/schemas/Trip' }
 *       400:
 *         description: Validation failed or capacity exceeded
 *       404:
 *         description: Vehicle or driver not found
 */
router.post('/', authorize('admin', 'fleet_manager'), validate(createTripSchema), tripController.create);

// GET /api/v1/trips

/**
 * @swagger
 * /api/v1/trips:
 *   get:
 *     tags: [Trips]
 *     summary: List all trips
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [Draft, Dispatched, Completed, Cancelled] }
 *       - in: query
 *         name: vehicle
 *         schema: { type: string }
 *       - in: query
 *         name: driver
 *         schema: { type: string }
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
 *         schema: { type: string, default: "-createdAt" }
 *     responses:
 *       200:
 *         description: Paginated trips
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     trips:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Trip' }
 *                     pagination: { $ref: '#/components/schemas/DriverPagination' }
 */
router.get('/', tripController.findAll);

// GET /api/v1/trips/:id

/**
 * @swagger
 * /api/v1/trips/{id}:
 *   get:
 *     tags: [Trips]
 *     summary: Get a single trip by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trip data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     trip: { $ref: '#/components/schemas/Trip' }
 */
router.get('/:id', tripController.findById);

// PATCH /api/v1/trips/:id

/**
 * @swagger
 * /api/v1/trips/{id}:
 *   patch:
 *     tags: [Trips]
 *     summary: Update a trip (Draft only)
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
 *               source: { type: string }
 *               destination: { type: string }
 *               vehicle: { type: string }
 *               driver: { type: string }
 *               cargoWeight: { type: number, minimum: 0 }
 *               plannedDistance: { type: number, minimum: 0 }
 *               revenue: { type: number, minimum: 0 }
 *     responses:
 *       200:
 *         description: Trip updated
 *       400:
 *         description: Not in Draft status or validation failed
 */
router.patch('/:id', authorize('admin', 'fleet_manager'), validate(updateTripSchema), tripController.update);

// DELETE /api/v1/trips/:id

/**
 * @swagger
 * /api/v1/trips/{id}:
 *   delete:
 *     tags: [Trips]
 *     summary: Delete a trip (Draft only)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trip deleted
 *       400:
 *         description: Not in Draft status
 */
router.delete('/:id', authorize('admin'), tripController.remove);

// POST /api/v1/trips/:id/dispatch

/**
 * @swagger
 * /api/v1/trips/{id}/dispatch:
 *   post:
 *     tags: [Trips]
 *     summary: Dispatch a trip
 *     description: >
 *       Dispatches a Draft trip. Runs 9 validation checks then atomically updates
 *       Trip, Vehicle, and Driver statuses in a MongoDB transaction.
 *
 *       **Vehicle:** Available → On Trip
 *
 *       **Driver:** Available → On Trip
 *
 *       **Trip:** Draft → Dispatched
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trip dispatched
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
 *                     trip: { $ref: '#/components/schemas/Trip' }
 *       400:
 *         description: >
 *           Not in Draft status, vehicle not available, driver not available,
 *           license expired, capacity exceeded, or driver suspended
 */
router.post('/:id/dispatch', authorize('admin', 'fleet_manager', 'dispatcher'), tripController.dispatch);

// POST /api/v1/trips/:id/complete

/**
 * @swagger
 * /api/v1/trips/{id}/complete:
 *   post:
 *     tags: [Trips]
 *     summary: Complete a dispatched trip
 *     description: >
 *       Completes a Dispatched trip. Atomically restores Vehicle and Driver
 *       to Available, records actual odometer and optional fuel consumed.
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
 *             required: [actualOdometer]
 *             properties:
 *               actualOdometer:
 *                 type: number
 *                 minimum: 0
 *                 example: 175
 *               fuelConsumed:
 *                 type: number
 *                 minimum: 0
 *                 example: 14.5
 *     responses:
 *       200:
 *         description: Trip completed
 *       400:
 *         description: Not in Dispatched status or validation failed
 */
router.post('/:id/complete', authorize('admin', 'fleet_manager', 'dispatcher'), validate(completeTripSchema), tripController.complete);

// POST /api/v1/trips/:id/cancel

/**
 * @swagger
 * /api/v1/trips/{id}/cancel:
 *   post:
 *     tags: [Trips]
 *     summary: Cancel a trip
 *     description: >
 *       Cancels a Draft or Dispatched trip. If dispatched, restores Vehicle
 *       and Driver to Available in a MongoDB transaction.
 *       Cannot cancel Completed or already Cancelled trips.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Trip cancelled
 *       400:
 *         description: Trip is already terminal (Completed/Cancelled)
 */
router.post('/:id/cancel', authorize('admin', 'fleet_manager', 'dispatcher'), tripController.cancel);

module.exports = router;
