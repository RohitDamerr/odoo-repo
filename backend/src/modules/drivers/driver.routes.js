const { Router } = require('express');
const driverController = require('./driver.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validation.middleware');
const {
    createDriverSchema,
    updateDriverSchema,
    updateDriverStatusSchema
} = require('../../validations/driver.validation');

const router = Router();

// ══════════════════════════════════════════════════════════════════════
//  All routes below this point require a valid JWT
// ══════════════════════════════════════════════════════════════════════
router.use(authenticate);

// ══════════════════════════════════════════════════════════════════════
//  Swagger Schema — Driver
// ══════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * components:
 *   schemas:
 *     Driver:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 6a53177aafeb0710b7498033
 *         name:
 *           type: string
 *           example: Alex Johnson
 *         licenseNumber:
 *           type: string
 *           example: DL-2024-00891
 *         licenseCategory:
 *           type: string
 *           example: Heavy Vehicle
 *         licenseExpiryDate:
 *           type: string
 *           format: date
 *           example: 2027-06-15
 *         contactNumber:
 *           type: string
 *           example: "+919876543210"
 *         safetyScore:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           example: 95
 *         status:
 *           type: string
 *           enum: [Available, On Trip, Off Duty, Suspended]
 *           example: Available
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     DriverPagination:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 20
 *         total:
 *           type: integer
 *           example: 45
 *         totalPages:
 *           type: integer
 *           example: 3
 */

// ══════════════════════════════════════════════════════════════════════
//  POST /api/v1/drivers
// ══════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/v1/drivers:
 *   post:
 *     tags: [Drivers]
 *     summary: Register a new driver
 *     description: >
 *       Creates a new driver profile. Status defaults to **Available** —
 *       the caller cannot override it. Requires admin or fleet_manager role.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - licenseNumber
 *               - licenseCategory
 *               - licenseExpiryDate
 *               - contactNumber
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Alex Johnson
 *               licenseNumber:
 *                 type: string
 *                 example: DL-2024-00891
 *               licenseCategory:
 *                 type: string
 *                 example: Heavy Vehicle
 *               licenseExpiryDate:
 *                 type: string
 *                 format: date
 *                 example: "2027-06-15"
 *               contactNumber:
 *                 type: string
 *                 minLength: 7
 *                 maxLength: 15
 *                 example: "+919876543210"
 *               safetyScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 default: 100
 *                 example: 95
 *     responses:
 *       201:
 *         description: Driver registered successfully
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
 *                   example: Driver registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
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
 *       403:
 *         description: Insufficient role permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Duplicate license number
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
    '/',
    authorize('admin', 'fleet_manager'),
    validate(createDriverSchema),
    driverController.create
);

// ══════════════════════════════════════════════════════════════════════
//  GET /api/v1/drivers
// ══════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/v1/drivers:
 *   get:
 *     tags: [Drivers]
 *     summary: List all drivers
 *     description: >
 *       Returns a paginated, filterable list of drivers.
 *       Accessible to any authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Available, On Trip, Off Duty, Suspended]
 *         description: Filter by driver status
 *         example: Available
 *       - in: query
 *         name: licenseCategory
 *         schema:
 *           type: string
 *         description: Filter by license category (case-insensitive partial match)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search across name and license number
 *         example: Alex
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Items per page (max 100)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: "-createdAt"
 *         description: Sort field (prefix with `-` for descending, e.g. `safetyScore` or `-createdAt`)
 *     responses:
 *       200:
 *         description: Paginated list of drivers
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
 *                     drivers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Driver'
 *                     pagination:
 *                       $ref: '#/components/schemas/DriverPagination'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', driverController.findAll);

// ══════════════════════════════════════════════════════════════════════
//  GET /api/v1/drivers/:id
// ══════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/v1/drivers/{id}:
 *   get:
 *     tags: [Drivers]
 *     summary: Get a single driver by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
 *         example: 6a53177aafeb0710b7498033
 *     responses:
 *       200:
 *         description: Driver data
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
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
 *       401:
 *         description: Missing or invalid access token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', driverController.findById);

// ══════════════════════════════════════════════════════════════════════
//  PATCH /api/v1/drivers/:id
// ══════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/v1/drivers/{id}:
 *   patch:
 *     tags: [Drivers]
 *     summary: Update driver information
 *     description: >
 *       Updates driver fields like name, license details, or safety score.
 *       **Status cannot be changed through this endpoint** — use
 *       `PATCH /api/v1/drivers/{id}/status` for status changes.
 *       Requires admin or fleet_manager role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
 *         example: 6a53177aafeb0710b7498033
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             minProperties: 1
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: Alex Johnson Updated
 *               licenseNumber:
 *                 type: string
 *                 example: DL-2025-00123
 *               licenseCategory:
 *                 type: string
 *                 example: Heavy Vehicle
 *               licenseExpiryDate:
 *                 type: string
 *                 format: date
 *                 example: "2028-06-15"
 *               contactNumber:
 *                 type: string
 *                 minLength: 7
 *                 maxLength: 15
 *               safetyScore:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 88
 *     responses:
 *       200:
 *         description: Driver updated
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
 *                   example: Driver updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
 *       400:
 *         description: Validation failed or no fields provided
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
 *       403:
 *         description: Insufficient role permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
    '/:id',
    authorize('admin', 'fleet_manager'),
    validate(updateDriverSchema),
    driverController.update
);

// ══════════════════════════════════════════════════════════════════════
//  DELETE /api/v1/drivers/:id
// ══════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/v1/drivers/{id}:
 *   delete:
 *     tags: [Drivers]
 *     summary: Delete a driver
 *     description: >
 *       Removes a driver record. **Blocked** if the driver is currently
 *       `On Trip` — the trip must be completed or cancelled first.
 *       Requires admin role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
 *         example: 6a53177aafeb0710b7498033
 *     responses:
 *       200:
 *         description: Driver deleted
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
 *                   example: Driver deleted successfully
 *       400:
 *         description: Cannot delete — driver is currently on a trip
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
 *       403:
 *         description: Insufficient role permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', authorize('admin'), driverController.remove);

// ══════════════════════════════════════════════════════════════════════
//  PATCH /api/v1/drivers/:id/status
// ══════════════════════════════════════════════════════════════════════

/**
 * @swagger
 * /api/v1/drivers/{id}/status:
 *   patch:
 *     tags: [Drivers]
 *     summary: Change driver status manually
 *     description: >
 *       Manually update a driver's status. Allowed transitions:
 *
 *       • `Available` → `Off Duty` or `Suspended`
 *
 *       • `Off Duty` → `Available` or `Suspended`
 *
 *       • `Suspended` → `Available`
 *
 *       **`On Trip` cannot be set manually** — it is assigned automatically
 *       when a trip is dispatched. Drivers who are already `On Trip` cannot
 *       have their status changed until the trip is completed or cancelled.
 *       Requires admin or fleet_manager role.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Driver ID
 *         example: 6a53177aafeb0710b7498033
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
 *                 enum: [Available, Off Duty, Suspended]
 *                 example: Off Duty
 *     responses:
 *       200:
 *         description: Status updated
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
 *                   example: Driver status updated to 'Off Duty'
 *                 data:
 *                   type: object
 *                   properties:
 *                     driver:
 *                       $ref: '#/components/schemas/Driver'
 *       400:
 *         description: Invalid status transition or driver is on a trip
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
 *       403:
 *         description: Insufficient role permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Driver not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch(
    '/:id/status',
    authorize('admin', 'fleet_manager'),
    validate(updateDriverStatusSchema),
    driverController.updateStatus
);

module.exports = router;
