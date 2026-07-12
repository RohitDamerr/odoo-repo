const mongoose = require('mongoose');

const fuelLogSchema = new mongoose.Schema(
    {
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            required: [true, 'Vehicle is required']
        },
        trip: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trip',
            default: null
        },
        liters: {
            type: Number,
            required: [true, 'Fuel liters is required'],
            min: 0
        },
        cost: {
            type: Number,
            required: [true, 'Fuel cost is required'],
            min: 0
        },
        odometer: {
            type: Number,
            default: null,
            min: 0
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('FuelLog', fuelLogSchema);
