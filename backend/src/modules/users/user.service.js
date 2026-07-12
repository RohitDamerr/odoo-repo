const User = require('../../models/User');
const ApiError = require('../../errors/ApiError');

const findAll = async ({ page = 1, limit = 20, sort = '-createdAt', search, role } = {}) => {
    const filter = {};
    if (role) filter.role = role;
    if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
            { name: { $regex: escaped, $options: 'i' } },
            { email: { $regex: escaped, $options: 'i' } }
        ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
    const sortDir = sort.startsWith('-') ? -1 : 1;

    const [users, total] = await Promise.all([
        User.find(filter).select('-password').sort({ [sortField]: sortDir }).skip(skip).limit(limitNum).lean(),
        User.countDocuments(filter)
    ]);

    return { users, total, page: pageNum, totalPages: Math.ceil(total / limitNum) };
};

const findById = async (id) => {
    const user = await User.findById(id).select('-password').lean();
    if (!user) throw ApiError.notFound('User not found');
    return user;
};

const update = async (id, data) => {
    if (data.email) {
        const existing = await User.findOne({ email: data.email, _id: { $ne: id } });
        if (existing) throw ApiError.conflict('A user with this email already exists');
    }

    const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true }).select('-password').lean();
    if (!user) throw ApiError.notFound('User not found');
    return user;
};

const remove = async (id, requestingUserId) => {
    if (id === requestingUserId) {
        throw ApiError.badRequest('You cannot delete your own account');
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) throw ApiError.notFound('User not found');
};

module.exports = { findAll, findById, update, remove };
