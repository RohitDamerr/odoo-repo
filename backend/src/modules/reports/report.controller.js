const reportService = require('./report.service');
const { exportReport } = require('../../services/export.service');

const buildQuery = (req) => ({
    startDate: req.query.startDate || null,
    endDate: req.query.endDate || null
});

/**
 * If a `?format=` query param is present, converts the data to the
 * requested file format and streams it as a download.  Otherwise
 * returns JSON (backward-compatible).
 *
 * @param {object}  res     — Express response
 * @param {object}  req     — Express request
 * @param {string}  title   — Report filename / heading
 * @param {object}  data    — Report payload from service
 */
const respond = async (req, res, title, data) => {
    const format = req.query.format;

    if (!format || format === 'json') {
        return res.status(200).json({ success: true, data });
    }

    if (!['csv', 'excel', 'pdf'].includes(format)) {
        return res.status(400).json({
            success: false,
            message: `Unsupported format '${format}'. Use csv, excel, pdf, or json (default).`
        });
    }

    const { buffer, contentType, extension } = await exportReport(format, title, data);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${title}.${extension}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
};

// ── Vehicle Reports ────────────────────────────────────────────────

const vehicleOverview = async (req, res) => {
    const data = await reportService.vehicleOverview();
    return respond(req, res, 'vehicle-overview', data);
};

const vehicleValue = async (req, res) => {
    const data = await reportService.vehicleValue();
    return respond(req, res, 'vehicle-value', data);
};

// ── Driver Reports ─────────────────────────────────────────────────

const driverOverview = async (req, res) => {
    const data = await reportService.driverOverview();
    return respond(req, res, 'driver-overview', data);
};

const driverLicenseExpiry = async (req, res) => {
    const data = await reportService.driverLicenseExpiry();
    return respond(req, res, 'driver-license-expiry', data);
};

// ── Fuel Reports ───────────────────────────────────────────────────

const fuelSummary = async (req, res) => {
    const data = await reportService.fuelSummary(buildQuery(req));
    return respond(req, res, 'fuel-summary', data);
};

const fuelEfficiency = async (req, res) => {
    const data = await reportService.fuelEfficiency(buildQuery(req));
    return respond(req, res, 'fuel-efficiency', data);
};

// ── Maintenance Reports ────────────────────────────────────────────

const maintenanceSummary = async (req, res) => {
    const data = await reportService.maintenanceSummary(buildQuery(req));
    return respond(req, res, 'maintenance-summary', data);
};

const maintenanceCostByVehicle = async (req, res) => {
    const data = await reportService.maintenanceCostByVehicle(buildQuery(req));
    return respond(req, res, 'maintenance-cost-by-vehicle', data);
};

const maintenanceDowntime = async (req, res) => {
    const data = await reportService.maintenanceDowntime(buildQuery(req));
    return respond(req, res, 'maintenance-downtime', data);
};

// ── Trip Reports ───────────────────────────────────────────────────

const tripSummary = async (req, res) => {
    const data = await reportService.tripSummary(buildQuery(req));
    return respond(req, res, 'trip-summary', data);
};

const tripRevenue = async (req, res) => {
    const data = await reportService.tripRevenue(buildQuery(req));
    return respond(req, res, 'trip-revenue', data);
};

// ── Expense Reports ────────────────────────────────────────────────

const expenseSummary = async (req, res) => {
    const data = await reportService.expenseSummary(buildQuery(req));
    return respond(req, res, 'expense-summary', data);
};

// ── ROI & Utilization ──────────────────────────────────────────────

const vehicleROI = async (_req, res) => {
    const data = await reportService.vehicleROI();
    return respond(_req, res, 'vehicle-roi', data);
};

const fleetUtilization = async (req, res) => {
    const data = await reportService.fleetUtilization({
        startDate: req.query.startDate || null,
        endDate: req.query.endDate || null
    });
    return respond(req, res, 'fleet-utilization', data);
};

module.exports = {
    vehicleOverview,
    vehicleValue,
    driverOverview,
    driverLicenseExpiry,
    fuelSummary,
    fuelEfficiency,
    maintenanceSummary,
    maintenanceCostByVehicle,
    maintenanceDowntime,
    tripSummary,
    tripRevenue,
    expenseSummary,
    vehicleROI,
    fleetUtilization
};
