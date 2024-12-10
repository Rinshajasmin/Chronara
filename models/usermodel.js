const mongoose =require('mongoose');
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
    // isBlocked:{
    //     type:Boolean,
    //     default:false
    // },
    // isAdmin:{
    //     type:Boolean,
    //     default:false
    // },
    // cart:[{
    //     type:Schema.Types.ObjectId,
    //     ref:"Cart"
    // }],
    // wallet:[{
    //      type:Schema.Types.ObjectId,
    //     ref:"Wishlist"
        
    // }],
    // orderHistory:[{
    //  type:Schema.Types.ObjectId,
    // ref:"Order"
    
    // }], 
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
module.exports = mongoose.model('User', userSchema);
