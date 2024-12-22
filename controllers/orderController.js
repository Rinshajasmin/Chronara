const User = require('../models/usermodel')
const Product = require("../models/productSchema");
const Order = require('../models/orderSchema')
const Address = require('../models/addressmodel')
const Cart = require('../models/cartSchema')
const mongodb = require("mongodb");
const mongoose = require('mongoose')


//admin side
// 
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({isDeleted:false})
        .populate({
            path: 'address', // Populate the address field in the Order schema
            select: 'username email' // Only select the username and email fields from the User schema
        })
             .populate('orderItems.product', 'productName category brand') // Populate product details
            .sort({ createdOn: -1 }); // Latest orders first

            console.log(orders)

        res.render('admin/orders', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Error fetching orders.');
    }
};
const deleteOrder = async (req, res) => {
    const { id } = req.params; // Extract product ID from route parameters

    try {
        // Find the product and mark it as deleted
        const orders = await Order.findByIdAndUpdate(
            id,
            { isDeleted: true },
            { new: true } // Return the updated product
        );

        if (!orders) {
            return res.status(404).send('order not found');
        }
  
        // Redirect back to the products list
        res.redirect('/admin/orders');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};



module.exports = {
    getAllOrders,
    deleteOrder
}