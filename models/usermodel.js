const mongoose =require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

// const { schema } = require('./adminmodel');
const {Schema} = mongoose
const userSchema=new Schema({
    username:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:false
    },
    phone:{
        type:String,
        required:false,
        unique:true,
        sparse:true,
        default:null
    },
    googleId:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
        required:false,
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    isAdmin:{
        type:Boolean,
        default:false
    },
    cart:[{
        type:Schema.Types.ObjectId,
        ref:"Cart"
    }],
    // wallet:[{
    //      type:Schema.Types.ObjectId,
    //     ref:"Wishlist"
        
    //}],
    orderHistory:[{
     type:Schema.Types.ObjectId,
    ref:"Order"
    
    }], 
    addresses: [{ // Add reference to the Address schema
        type: Schema.Types.ObjectId,
        ref: "Address"
    }],
    firstName: { type: String },
    lastName: { type: String },
    
    
    secondaryEmail: { type: String },

    country: { type: String },
    state: { type: String },
    pinCode: { type: String },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // Referencing Product collection
    referralCode: { type: String, unique: true }, // Unique referral code for the user
    referredBy: { type: String, default: null }, // Referral code of the user who referred this user

    wallet: {
        type: Schema.Types.ObjectId,
        ref: 'Wallet'
    },
    
    createdOn : {
        type:Date,
        default:Date.now,
    },
   
})
userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);
