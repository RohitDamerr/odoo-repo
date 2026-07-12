const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Driver name is required'],
            trim: true
        },
        licenseNumber: {
            type: String,
            required: [true, 'License number is required'],
            unique: true,
            trim: true
        },
        licenseCategory: {
            type: String,
            required: [true, 'License category is required'],
            trim: true
        },
        licenseExpiryDate: {
            type: Date,
            required: [true, 'License expiry date is required']
        },
        contactNumber: {
            type: String,
            required: [true, 'Contact number is required'],
            trim: true
        },
        safetyScore: {
            type: Number,
            default: 100,
            min: 0,
            max: 100
        },
        status: {
            type: String,
            enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
            default: 'Available'
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Driver', driverSchema);
