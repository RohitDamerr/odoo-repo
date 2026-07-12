const userService = require('./user.service');

const list = async (req, res) => {
    const { page, limit, sort, search, role } = req.query;
    const result = await userService.findAll({ page, limit, sort, search, role });
    res.status(200).json({ success: true, data: result });
};

const getById = async (req, res) => {
    const user = await userService.findById(req.params.id);
    res.status(200).json({ success: true, data: { user } });
};

const update = async (req, res) => {
    const user = await userService.update(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'User updated', data: { user } });
};

const remove = async (req, res) => {
    await userService.remove(req.params.id, req.user._id.toString());
    res.status(200).json({ success: true, message: 'User deleted' });
};

module.exports = { list, getById, update, remove };
