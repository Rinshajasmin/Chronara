const mongoose = require('mongoose')
const {Schema} = mongoose;


const referralSchema = new mongoose.Schema({
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // User who referred
    refereeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // New user referred
    rewardGiven: { type: Boolean, default: false }, // Status of the reward
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Referral', referralSchema);
