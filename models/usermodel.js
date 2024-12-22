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
    }]
    // createdOn : {
    //     type:Date,
    //     default:Date.now,
    // },
    // referalCode:{
    //     type:String
    // },
    // redeemed:{
    //     type:Boolean
    // },
    // redeemedUsers: [{
    //     type: Schema.Types.ObjectId,
    //     ref:"User"
    // }],
    // searchHistory: [{
    //     category: {
    //         type: Schema.Types.ObjectId,
    //         ref:"Category",
    //     },
    //     brand: {
    //         type : String
    //     },
    //     searchOn : {
    //         type: Date,
    //         default: Date.now
    //     }
    // }]

})
userSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('User', userSchema);
