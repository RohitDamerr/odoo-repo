const fuelService = require('./fuel.service');

const create = async (req, res) => {
    const fuelLog = await fuelService.create(req.body);
    res.status(201).json({ success: true, message: 'Fuel transaction logged successfully', data: { fuelLog } });
};

const findAll = async (req, res) => {
    const result = await fuelService.findAll(req.query);
    res.status(200).json({
        success: true,
        data: {
            fuelLogs: result.fuelLogs,
            pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
        }
    });
};

const findById = async (req, res) => {
    const fuelLog = await fuelService.findById(req.params.id);
    res.status(200).json({ success: true, data: { fuelLog } });
};

const update = async (req, res) => {
    const fuelLog = await fuelService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Fuel log updated successfully', data: { fuelLog } });
};

const remove = async (req, res) => {
    await fuelService.remove(req.params.id);
    res.status(200).json({ success: true, message: 'Fuel log deleted successfully' });
};

const getEfficiency = async (req, res) => {
    const result = await fuelService.getEfficiency(req.params.vehicleId, req.query.startDate, req.query.endDate);
    res.status(200).json({ success: true, data: result });
};

module.exports = { create, findAll, findById, update, remove, getEfficiency };
