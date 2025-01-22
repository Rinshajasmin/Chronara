const mongoose = require('mongoose');
const {Schema} = mongoose;

const cartSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },

    isDeleted:{
        type:Boolean,
        default:false

    },
    items:[{
        productId:{
            type:Schema.Types.ObjectId,
            ref:'Product',
            required:true
        },
        quantity:{
            type:Number,
            default:1
        },
        price:{
            type:Number,
            required:true
        },
        totalPrice:{
            type:Number,
            required:true

        },
        status:{
            type:String,
            default:'placed'
        },
        cancellationReason:{
            type:String,
            default:"none"
        }
    }],
    coupon: {
        code: {
            type: String,
            default: null
        },
        discount: {
            type: Number,
            default: 0
        }
    },
    grandTotal: {
        type: Number,
        required: true,
        default: 0
    },
   
})

const Cart = mongoose.model('Cart',cartSchema)
module.exports = Cart;