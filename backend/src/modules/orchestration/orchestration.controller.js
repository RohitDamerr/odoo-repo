const orchestration = require('../../services/orchestration.service');

/**
 * POST /api/orchestration/dispatch
 * Dispatch a trip: Vehicle → On Trip, Driver → On Trip.
 */
const dispatch = async (req, res) => {
    const result = await orchestration.dispatchTrip({
        vehicleId: req.body.vehicleId,
        driverId: req.body.driverId
    });

    res.status(200).json({
        success: true,
        message: 'Trip dispatched — vehicle and driver set to On Trip',
        data: result
    });
};

/**
 * POST /api/orchestration/validate-dispatch
 * Pre-flight check — validates dispatch conditions without mutating anything.
 */
const validateDispatch = async (req, res) => {
    const result = await orchestration.validateDispatch({
        vehicleId: req.body.vehicleId,
        driverId: req.body.driverId
    });

    res.status(200).json({
        success: true,
        data: result
    });
};

/**
 * POST /api/orchestration/complete
 * Complete a trip: Vehicle → Available, Driver → Available.
 */
const complete = async (req, res) => {
    const result = await orchestration.completeTrip({
        vehicleId: req.body.vehicleId,
        driverId: req.body.driverId
    });

    res.status(200).json({
        success: true,
        message: 'Trip completed — vehicle and driver set to Available',
        data: result
    });
};

/**
 * POST /api/orchestration/cancel
 * Cancel a trip — rolls back vehicle and driver if dispatched.
 */
const cancel = async (req, res) => {
    const result = await orchestration.cancelTrip({
        vehicleId: req.body.vehicleId,
        driverId: req.body.driverId,
        currentTripStatus: req.body.currentTripStatus
    });

    const wasDispatched = req.body.currentTripStatus === 'Dispatched';
    res.status(200).json({
        success: true,
        message: wasDispatched
            ? 'Trip cancelled — vehicle and driver rolled back to Available'
            : 'Trip cancelled (was only a Draft — no status rollback needed)',
        data: result
    });
};

module.exports = {
    dispatch,
    validateDispatch,
    complete,
    cancel
};
