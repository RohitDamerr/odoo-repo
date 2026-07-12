const tripService = require('./trip.service');

const create = async (req, res) => {
    const trip = await tripService.create(req.body);
    res.status(201).json({ success: true, message: 'Trip created successfully', data: { trip } });
};

const findAll = async (req, res) => {
    const result = await tripService.findAll(req.query);
    res.status(200).json({
        success: true,
        data: {
            trips: result.trips,
            pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
        }
    });
};

const findById = async (req, res) => {
    const trip = await tripService.findById(req.params.id);
    res.status(200).json({ success: true, data: { trip } });
};

const update = async (req, res) => {
    const trip = await tripService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Trip updated successfully', data: { trip } });
};

const remove = async (req, res) => {
    await tripService.remove(req.params.id);
    res.status(200).json({ success: true, message: 'Trip deleted successfully' });
};

const dispatch = async (req, res) => {
    const trip = await tripService.dispatch(req.params.id);
    res.status(200).json({ success: true, message: 'Trip dispatched successfully', data: { trip } });
};

const complete = async (req, res) => {
    const trip = await tripService.complete(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Trip completed successfully', data: { trip } });
};

const cancel = async (req, res) => {
    const trip = await tripService.cancel(req.params.id);
    res.status(200).json({ success: true, message: 'Trip cancelled successfully', data: { trip } });
};

module.exports = { create, findAll, findById, update, remove, dispatch, complete, cancel };
