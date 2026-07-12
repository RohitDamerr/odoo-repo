const { Router } = require('express');
const orchestrationController = require('./orchestration.controller');
const authenticate = require('../../middleware/auth.middleware');
const authorize = require('../../middleware/role.middleware');
const validate = require('../../middleware/validation.middleware');
const Joi = require('joi');

const router = Router();

// All orchestration endpoints require authentication
router.use(authenticate);

// ── Validation schemas ─────────────────────────────────────────────

const dispatchSchema = Joi.object({
    vehicleId: Joi.string().required().messages({
        'any.required': 'vehicleId is required'
    }),
    driverId: Joi.string().required().messages({
        'any.required': 'driverId is required'
    })
});

const cancelSchema = Joi.object({
    vehicleId: Joi.string().required(),
    driverId: Joi.string().required(),
    currentTripStatus: Joi.string().valid('Draft', 'Dispatched').required().messages({
        'any.only': 'currentTripStatus must be "Draft" or "Dispatched"',
        'any.required': 'currentTripStatus is required'
    })
});

/**
 * @swagger
 * /api/orchestration/validate-dispatch:
 *   post:
 *     tags: [Orchestration]
 *     summary: Pre-flight check for trip dispatch
 *     description: >
 *       Validates that both vehicle and driver are eligible for dispatch.
 *       Returns per-condition check results without mutating anything.
 *       Use this before calling /dispatch to surface all errors at once in the UI.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, driverId]
 *             properties:
 *               vehicleId:
 *                 type: string
 *               driverId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Validation result (ok + checks object)
 */
router.post(
    '/validate-dispatch',
    authorize('admin', 'fleet_manager'),
    validate(dispatchSchema),
    orchestrationController.validateDispatch
);

/**
 * @swagger
 * /api/orchestration/dispatch:
 *   post:
 *     tags: [Orchestration]
 *     summary: Dispatch a trip
 *     description: >
 *       Atomically transitions Vehicle → 'On Trip' and Driver → 'On Trip'.
 *       Validates pre-conditions: vehicle must be Available, driver must be
 *       Available with a valid license. Called by the Trip module after
 *       creating the Trip in Draft status.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, driverId]
 *             properties:
 *               vehicleId:
 *                 type: string
 *               driverId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Both vehicle and driver set to On Trip
 *       400:
 *         description: Pre-condition failed (vehicle not Available, driver not Available, expired license, etc.)
 */
router.post(
    '/dispatch',
    authorize('admin', 'fleet_manager'),
    validate(dispatchSchema),
    orchestrationController.dispatch
);

/**
 * @swagger
 * /api/orchestration/complete:
 *   post:
 *     tags: [Orchestration]
 *     summary: Complete a trip
 *     description: >
 *       Transitions Vehicle → 'Available' and Driver → 'Available'.
 *       Both must currently be 'On Trip'.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, driverId]
 *             properties:
 *               vehicleId:
 *                 type: string
 *               driverId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Both vehicle and driver restored to Available
 *       400:
 *         description: Vehicle or driver is not currently On Trip
 */
router.post(
    '/complete',
    authorize('admin', 'fleet_manager'),
    validate(dispatchSchema),
    orchestrationController.complete
);

/**
 * @swagger
 * /api/orchestration/cancel:
 *   post:
 *     tags: [Orchestration]
 *     summary: Cancel a trip
 *     description: >
 *       If the trip was Dispatched, rolls back Vehicle and Driver to 'Available'.
 *       If only a Draft, no status rollback is performed.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, driverId, currentTripStatus]
 *             properties:
 *               vehicleId:
 *                 type: string
 *               driverId:
 *                 type: string
 *               currentTripStatus:
 *                 type: string
 *                 enum: [Draft, Dispatched]
 *     responses:
 *       200:
 *         description: Trip cancelled, statuses rolled back if applicable
 */
router.post(
    '/cancel',
    authorize('admin', 'fleet_manager'),
    validate(cancelSchema),
    orchestrationController.cancel
);

module.exports = router;
