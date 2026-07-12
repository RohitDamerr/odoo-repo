const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
    {
        vehicle: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vehicle',
            default: null
        },
        trip: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Trip',
            default: null
        },
        type: {
            type: String,
            required: [true, 'Expense type is required'],
            enum: ['fuel', 'toll', 'maintenance', 'parking', 'repair', 'miscellaneous']
        },
        amount: {
            type: Number,
            required: [true, 'Amount is required'],
            min: 0
        },
        description: {
            type: String,
            trim: true
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

module.exports = mongoose.model('Expense', expenseSchema);
