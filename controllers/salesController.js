const Admin = require('../models/adminmodel')
const Wallet = require('../models/walletSchema')
const Order = require('../models/orderSchema')
const Product = require('../models/productSchema');


const getSalesPage = async(req,res)=>{
    try {
        res.render('admin/sales')
    } catch (error) {
        
    }

}

module.exports={getSalesPage}
