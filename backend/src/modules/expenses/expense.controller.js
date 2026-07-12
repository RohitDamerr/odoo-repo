const expenseService = require('./expense.service');

const create = async (req, res) => {
    const expense = await expenseService.create(req.body);
    res.status(201).json({ success: true, message: 'Expense logged successfully', data: { expense } });
};

const findAll = async (req, res) => {
    const result = await expenseService.findAll(req.query);
    res.status(200).json({
        success: true,
        data: {
            expenses: result.expenses,
            pagination: { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages }
        }
    });
};

const findById = async (req, res) => {
    const expense = await expenseService.findById(req.params.id);
    res.status(200).json({ success: true, data: { expense } });
};

const update = async (req, res) => {
    const expense = await expenseService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Expense updated successfully', data: { expense } });
};

const remove = async (req, res) => {
    await expenseService.remove(req.params.id);
    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
};

const aggregateByVehicle = async (req, res) => {
    const result = await expenseService.aggregateByVehicle(req.params.vehicleId);
    res.status(200).json({ success: true, data: result });
};

const aggregateByTrip = async (req, res) => {
    const result = await expenseService.aggregateByTrip(req.params.tripId);
    res.status(200).json({ success: true, data: result });
};

module.exports = { create, findAll, findById, update, remove, aggregateByVehicle, aggregateByTrip };
