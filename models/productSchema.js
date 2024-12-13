const mongoose=require('mongoose')
const {Schema} = mongoose;

const productSchema=new Schema({
    productName:{
        type:String,
        required:true
    },
    productDesc:{
        type:String,
        required:true
    },
    brand:{
        type:String,
        required:false
    },
    category:{
        type:Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    regularPrice:{
       type:Number,
       required:false
    },
    salePrice:{
        type:Number,
        required:false
    },
    productOffer:{
        type:Number,
        default:0
    },
    quantity:{
        type:Number,
        default:false
    },
    color:{
        type:String,
        required:false
    },
    productImage:{
        type:[String],
        required:false
    },
    isDeleted:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["Available","out of stock"],
        required:false,
        default:"Available"
    },
},{timestamps:true});
const Product = mongoose.model("Product",productSchema)
module.exports=Product;