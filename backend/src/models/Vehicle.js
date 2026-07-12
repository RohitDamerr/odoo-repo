const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
    {
        registrationNumber: {
            type: String,
            required: [true, 'Registration number is required'],
            unique: true,
            uppercase: true,
            trim: true
        },
        name: {
            type: String,
            required: [true, 'Vehicle name/model is required'],
            trim: true
        },
        type: {
            type: String,
            required: [true, 'Vehicle type is required'],
            enum: ['Truck', 'Van', 'Pickup', 'Trailer', 'Bus', 'Car', 'Other']
        },
        maxLoadCapacity: {
            type: Number,
            required: [true, 'Maximum load capacity is required'],
            min: 0
        },
        odometer: {
            type: Number,
            default: 0,
            min: 0
        },
        acquisitionCost: {
            type: Number,
            required: [true, 'Acquisition cost is required'],
            min: 0
        },
        fuelType: {
            type: String,
            enum: ['Diesel', 'Electric', 'Hybrid', 'Gasoline', null],
            default: null
        },
        registrationExpiryDate: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: ['Available', 'On Trip', 'In Shop', 'Retired'],
            default: 'Available'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
