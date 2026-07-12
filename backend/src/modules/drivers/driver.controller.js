const driverService = require('./driver.service');

const create = async (req, res) => {
    const driver = await driverService.create(req.body);
    res.status(201).json({ success: true, message: 'Driver registered successfully', data: { driver } });
};

const findAll = async (req, res) => {
    const result = await driverService.findAll(req.query);
    res.status(200).json({
        success: true,
        data: {
            drivers: result.drivers,
            pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
        }
    });
};

const findById = async (req, res) => {
    const driver = await driverService.findById(req.params.id);
    res.status(200).json({ success: true, data: { driver } });
};

const update = async (req, res) => {
    const driver = await driverService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Driver updated successfully', data: { driver } });
};

const remove = async (req, res) => {
    await driverService.remove(req.params.id);
    res.status(200).json({ success: true, message: 'Driver deleted successfully' });
};

const updateStatus = async (req, res) => {
    const driver = await driverService.updateStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, message: `Driver status updated to '${driver.status}'`, data: { driver } });
};

module.exports = { create, findAll, findById, update, remove, updateStatus };
