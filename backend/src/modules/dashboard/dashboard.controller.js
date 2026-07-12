const dashboardService = require('./dashboard.service');

const getKPIs = async (req, res) => {
    const data = await dashboardService.getKPIs({
        startDate: req.query.startDate || null,
        endDate: req.query.endDate || null
    });
    res.status(200).json({ success: true, data });
};

module.exports = { getKPIs };
