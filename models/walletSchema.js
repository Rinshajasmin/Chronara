const mongoose = require('mongoose');
const { Schema } = mongoose;
const {v4:uuidv4} = require('uuid')

const walletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Reference to the user owning the wallet
        required: true,
        unique: true // Each user has a single wallet
    },
    balance: {
        type: Number,
        default: 0, // Default wallet balance
        required: true
    },
    transactions: [
        {
            transactionId: {
                type: String,
                default: () => uuidv4(), // Unique ID for the transaction
                required: true
            },
            description: {
                type: String,
                required: true // Description of the transaction (e.g., "Order Payment", "Refund")
            },
            type: {
                type: String,
                required: true,
                enum: ['Deposit', 'Withdrawal','Refund'] // Type of transaction
            },
            amount: {
                type: Number,
                required: true // Transaction amount
            },
            orderId: {
                type: Schema.Types.ObjectId,
                ref: 'Order', // Reference to the order (if applicable)
                default: null
            },
            date: {
                type: Date,
                default: Date.now // Timestamp of the transaction
            }
        }
    ],
    createdOn: {
        type: Date,
        default: Date.now // When the wallet was created
    },
    updatedOn: {
        type: Date,
        default: Date.now // When the wallet was last updated
    }
});

// Middleware to update `updatedOn` before saving
walletSchema.pre('save', function (next) {
    this.updatedOn = Date.now();
    next();
});
 
const Wallet = mongoose.model('Wallet', walletSchema);
module.exports = Wallet;