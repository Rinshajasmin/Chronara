
const User = require('../models/usermodel')
const Product = require("../models/productSchema");
const Order = require('../models/orderSchema')
const Address = require('../models/addressmodel')
const Cart = require('../models/cartSchema')
const mongodb = require("mongodb");
const mongoose = require('mongoose')



const getAllCoupons = async(req,res)=>{
    try {
        res.render('admin/couponManagement')
    } catch (error) {
        
    }
}

module.exports={getAllCoupons}