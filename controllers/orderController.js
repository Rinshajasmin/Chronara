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
        res.redirect('/admin/dashBoard');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

const getEditOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('address') // Populate the address (User) details
            .populate('orderItems.product') // Populate the product details in the orderItems array
            .populate({
                path: 'address', // Access address field in User
                populate: {
                    path: 'addresses', // Populate the array of addresses in the User
                    model: 'Address'
                }
            });

            const user = await User.findById(order.address); // Using the address field which stores the userId
        
            if (!user) {
                return res.status(404).send('User not found');
            }
    
            // Find the specific address associated with this user and the order
            const selectedAddress = await Address.findOne({
                userId: user._id,
                _id: { $in: user.addresses }, // Check if the order's address ID is in the user's addresses array
                isDeleted: false // Filter out deleted addresses, if applicable
            });
    
            if (!selectedAddress) {
                return res.status(404).send('Selected address not found');
            }
    
            // Prepare the address details to be passed to the template
            const addressDetails = selectedAddress.address.map(addr => ({
                _id: addr._id,
                name: addr.name,
                city: addr.city,
                state: addr.state,
                pincode: addr.pincode,
                landMark: addr.landMark,
                phone: addr.phone,
                addressType:addr.addressType,
                altPhone:addr.altPhone
            }));
    
        if (!order) {
            return res.status(404).send('Order not found');
        }
        order.orderItems.forEach(item => {
            item.totalPrice = item.quantity * item.price; // Calculate totalPrice for each item
        });

        // Calculate the total order amount
        const totalOrderPrice = order.orderItems.reduce((acc, item) => acc + item.totalPrice, 0);

        // Add the totalOrderPrice to the order object
        order.totalOrderPrice = totalOrderPrice;

        

        res.render('admin/editOrder', { order ,addressDetails});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching order details.');
    }
};
const updateStatus = async(req,res)=>{
    try {
        const orderId = req.params.id;
        const updatedStatus = req.body.status;
        console.log(orderId)
        console.log(updatedStatus)

        // Find the order by ID and update the status
        const order = await Order.findByIdAndUpdate(orderId, { status: updatedStatus }, { new: true });

        if (!order) {
            return res.status(404).send('Order not found');
        }
       // res.status(200).json({ success: true, message: 'Order status updated successfully', order });

        // Redirect to the updated order details page
        // res.render('admin/orders');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating order status');
    }

}
const getOrderslist = async(req,res)=>{
    try{
    const userId = req.session.user;
    const order = await Order.findById(userId)
    .populate('orderItems.product', 'productName ')
    .sort({ createdOn: -1 });

    res.render('user/userProfile',{order})
    }catch(error){
        console.log("error while displaying userorders",error)
        res.status(500).send('Error loading orders');

    }
}




module.exports = {
    getAllOrders,
    deleteOrder,
    getEditOrder,
    updateStatus,
    getOrderslist
}