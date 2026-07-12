const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema(
    {
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: [true, 'Vehicle is required']
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true
        },
        type: {
            type: String,
            required: [true, 'Maintenance type is required'],
            enum: ['Oil Change', 'Tire Replacement', 'Engine Repair', 'Brake Service', 'General Service', 'Inspection', 'Other']
        },
        cost: {
            type: Number,
            default: 0,
            min: 0
        },
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: ['Active', 'Closed'],
            default: 'Active'
        },
        notes: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
