const { Router } = require('express');
const maintenanceController = require('./maintenance.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validation.middleware');
const {
    createMaintenanceSchema,
    updateMaintenanceSchema,
    closeMaintenanceSchema,
    listMaintenanceQuerySchema
} = require('../../validations/maintenance.validation');

const router = Router();

// All maintenance routes require authentication
router.use(authenticate);

/**
 * @swagger
 * components:
 *   schemas:
 *     MaintenanceLog:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6a5323b73e7583737c92d600
 *         vehicle:
 *           oneOf:
 *             - type: string
 *               description: Vehicle ID (when creating/updating)
 *             - type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 registrationNumber:
 *                   type: string
 *                 name:
 *                   type: string
 *                 type:
 *                   type: string
 *                 status:
 *                   type: string
 *               description: Populated vehicle (in responses)
 *         description:
 *           type: string
 *           example: Replace worn brake pads and rotors
 *         type:
 *           type: string
 *           enum: [Oil Change, Tire Replacement, Engine Repair, Brake Service, General Service, Inspection, Other]
 *           example: Brake Service
 *         cost:
 *           type: number
 *           example: 450
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [Active, Closed]
 *           example: Active
 *         notes:
 *           type: string
 *           example: Front and rear pads replaced. Rotors resurfaced.
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     MaintenanceList:
 *       type: object
 *       properties:
 *         logs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MaintenanceLog'
 *         total:
 *           type: number
 *           example: 15
 *         page:
 *           type: number
 *           example: 1
 *         totalPages:
 *           type: number
 *           example: 1
 *     MaintenanceStats:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *           example: 15
 *         active:
 *           type: number
 *           example: 3
 *         closed:
 *           type: number
 *           example: 12
 *         totalCost:
 *           type: number
 *           example: 8750
 *         byType:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 example: Brake Service
 *               count:
 *                 type: number
 *                 example: 5
 *               totalCost:
 *                 type: number
 *                 example: 2250
 */

// ── Stats (before /:id) ────────────────────────────────────────────

/**
 * @swagger
 * /api/maintenance/stats:
 *   get:
 *     tags: [Maintenance]
 *     summary: Get maintenance dashboard statistics
 *     description: Returns total, active, closed counts, total cost, and breakdown by maintenance type.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MaintenanceStats'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/stats', maintenanceController.stats);

// ── List all ───────────────────────────────────────────────────────

/**
 * @swagger
 * /api/maintenance:
 *   get:
 *     tags: [Maintenance]
 *     summary: List maintenance logs
 *     description: >
 *       Returns paginated, filterable maintenance logs. Each log includes a populated vehicle
 *       summary (registrationNumber, name, type, status).
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *           default: '-createdAt'
 *         description: "Sort field. Options: startDate, -startDate, cost, -cost, createdAt, -createdAt"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Active, Closed]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Oil Change, Tire Replacement, Engine Repair, Brake Service, General Service, Inspection, Other]
 *       - in: query
 *         name: vehicle
 *         schema:
 *           type: string
 *         description: Filter by vehicle ID
 *     responses:
 *       200:
 *         description: Paginated maintenance logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/MaintenanceList'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', validate(listMaintenanceQuerySchema, 'query'), maintenanceController.list);

// ── Create (open maintenance) ──────────────────────────────────────

/**
 * @swagger
 * /api/maintenance:
 *   post:
 *     tags: [Maintenance]
 *     summary: Open a new maintenance job
 *     description: >
 *       Creates an Active maintenance log. The vehicle is automatically set to 'In Shop'
 *       if currently 'Available'. Vehicles that are 'On Trip' or 'Retired' are rejected.
 *       Restricted to admin, fleet_manager, and safety_officer.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicle, description, type]
 *             properties:
 *               vehicle:
 *                 type: string
 *                 description: Vehicle MongoDB _id
 *                 example: 6a5323b73e7583737c92d571
 *               description:
 *                 type: string
 *                 example: Replace worn brake pads and rotors
 *               type:
 *                 type: string
 *                 enum: [Oil Change, Tire Replacement, Engine Repair, Brake Service, General Service, Inspection, Other]
 *                 example: Brake Service
 *               cost:
 *                 type: number
 *                 default: 0
 *                 example: 450
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *                 example: Front and rear. Pads at 2mm.
 *     responses:
 *       201:
 *         description: Maintenance job opened
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
 *                   example: Maintenance job opened — vehicle set to In Shop
 *                 data:
 *                   type: object
 *                   properties:
 *                     maintenance:
 *                       $ref: '#/components/schemas/MaintenanceLog'
 *       400:
 *         description: Validation failed or vehicle not eligible
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
 */
router.post(
    '/',
    authorize('admin', 'fleet_manager', 'safety_officer'),
    validate(createMaintenanceSchema),
    maintenanceController.create
);

// ── Get single ─────────────────────────────────────────────────────

/**
 * @swagger
 * /api/maintenance/{id}:
 *   get:
 *     tags: [Maintenance]
 *     summary: Get maintenance log by ID
 *     description: Returns a single maintenance log with the vehicle populated.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maintenance log found
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
 *                     maintenance:
 *                       $ref: '#/components/schemas/MaintenanceLog'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', maintenanceController.getById);

// ── Update ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/maintenance/{id}:
 *   put:
 *     tags: [Maintenance]
 *     summary: Update a maintenance log
 *     description: >
 *       Updates fields on an Active maintenance log. Closed logs cannot be updated.
 *       Restricted to admin, fleet_manager, and safety_officer.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               description:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [Oil Change, Tire Replacement, Engine Repair, Brake Service, General Service, Inspection, Other]
 *               cost:
 *                 type: number
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Maintenance log updated
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
 *                     maintenance:
 *                       $ref: '#/components/schemas/MaintenanceLog'
 *       400:
 *         description: Validation failed or log is closed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
    '/:id',
    authorize('admin', 'fleet_manager', 'safety_officer'),
    validate(updateMaintenanceSchema),
    maintenanceController.update
);

// ── Close ──────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/maintenance/{id}/close:
 *   patch:
 *     tags: [Maintenance]
 *     summary: Close a maintenance job
 *     description: >
 *       Marks a maintenance job as Closed. Sets endDate to now, optionally updates the final cost.
 *       If no other Active maintenance logs exist for the vehicle, it is automatically restored to
 *       'Available'. Restricted to admin, fleet_manager, and safety_officer.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cost:
 *                 type: number
 *                 description: Final cost (overrides existing)
 *                 example: 520
 *               notes:
 *                 type: string
 *                 description: Final notes (overrides existing)
 *                 example: All work completed. Test drive passed.
 *     responses:
 *       200:
 *         description: Maintenance job closed
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
 *                   example: Maintenance job closed — vehicle restored to Available
 *                 data:
 *                   type: object
 *                   properties:
 *                     maintenance:
 *                       $ref: '#/components/schemas/MaintenanceLog'
 *       400:
 *         description: Already closed or vehicle status conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
    '/:id/close',
    authorize('admin', 'fleet_manager', 'safety_officer'),
    validate(closeMaintenanceSchema),
    maintenanceController.close
);

// ── Re-open ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/maintenance/{id}/reopen:
 *   patch:
 *     tags: [Maintenance]
 *     summary: Re-open a closed maintenance log
 *     description: >
 *       Re-activates a previously closed maintenance log. Clears endDate and sets status
 *       back to Active. Moves the vehicle back to 'In Shop' if currently 'Available'.
 *       Restricted to admin, fleet_manager, and safety_officer.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maintenance log re-opened
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
 *                   example: Maintenance log re-opened — vehicle set to In Shop
 *                 data:
 *                   type: object
 *                   properties:
 *                     maintenance:
 *                       $ref: '#/components/schemas/MaintenanceLog'
 *       400:
 *         description: Already active or vehicle is retired/on trip
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
    '/:id/reopen',
    authorize('admin', 'fleet_manager', 'safety_officer'),
    maintenanceController.reopen
);

// ── Delete ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/maintenance/{id}:
 *   delete:
 *     tags: [Maintenance]
 *     summary: Delete a maintenance log
 *     description: >
 *       Permanently removes a maintenance log. Only Closed logs can be deleted.
 *       Restricted to admin only.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Maintenance log deleted
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
 *                   example: Maintenance log deleted successfully
 *       400:
 *         description: Cannot delete active log
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden — admin only
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete(
    '/:id',
    authorize('admin'),
    maintenanceController.remove
);

module.exports = router;
