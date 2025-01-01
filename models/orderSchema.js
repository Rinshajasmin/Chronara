const mongoose = require('mongoose')
const {Schema} = mongoose;
const {v4:uuidv4} = require('uuid') // to generate a random number inorder to display the users becoz actual productid cannot be displayed


const orderSchema = new mongoose.Schema({
    orderId:{
        type:String,
        default:()=>uuidv4(),
        unique:true
    },
    orderItems:[{
        product:{
            type:Schema.Types.ObjectId,
            ref:'Product',
            required:true
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            default:0
        }
    }],
    totalPrice:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
        default:0
    },
    finalAmount:{
        type:Number,
        required:true
    },
    address:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    invoiceDate:{
        type:Date
    },
    status:{
        type:String,
        required:true,
        enum:['Pending','Processing','Shipped','Delivered','Cancelled','Return request','Returned']
    },
    createdOn:{
        type:Date,
        default:Date.now,
        required:true
    },
    couponApplied:{
        type:Boolean,
        default:false
    },
    paymentMethod: {
        type: String,
        required: true,  // Make it required since the user selects a payment method at checkout
        enum: ['Cards', 'UPI', 'Net Banking', 'Cash on Delivery']  // Add payment options as per your requirement
    },
    paymentStatus: { // New field for payment status
        type: String,
        required: true,
        enum: ['Pending', 'Awaiting Payment','Paid', 'Failed'],
        default: 'Pending', // Default value for new orders
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    selectedAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address' ,required:true}, // Reference to Address

    
    
})

const Order = mongoose.model("Order",orderSchema)
module.exports = Order;