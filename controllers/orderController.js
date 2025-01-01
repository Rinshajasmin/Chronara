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

// const getEditOrder = async (req, res) => {
//     try {
//         // Find the order by ID
//         const order = await Order.findById(req.params.id)
//             .populate('orderItems.product'); // Populate product details in order items

//         if (!order) {
//             return res.status(404).send('Order not found');
//         }

//         // Use the selectedAddress field to find the specific address
//         const selectedAddressDocument = await Address.findOne(
//             { "address._id": order.selectedAddress }, // Match the specific address ID
//             { "address.$": 1 } // Project only the matching address element
//         );

//         if (!selectedAddressDocument || !selectedAddressDocument.address.length) {
//             return res.status(404).send('Selected address not found in the Address document.');
//         }
//         console.log(selectedAddressDocument)
//         // Extract the specific address
//         //const specificAddress = selectedAddressDocument.address[0];

//         // Calculate total price for each order item
//         order.orderItems.forEach((item) => {
//             item.totalPrice = item.quantity * item.price;
//         });

//         // Calculate the total order amount
//         const totalOrderPrice = order.orderItems.reduce(
//             (acc, item) => acc + item.totalPrice,
//             0
//         );

//         // Add the totalOrderPrice to the order object
//         order.totalOrderPrice = totalOrderPrice;

//         // Render the order details page with the specific address
//         res.render('admin/editOrder', { order, addressDetails:selectedAddressDocument.address[0]});
//     } catch (error) {
//         console.error('Error fetching order details:', error);
//         res.status(500).send('Error fetching order details.');
//     }
// };


const getEditOrder = async (req, res) => {
    try {
        
        const order = await Order.findById(req.params.id)
            .populate('address') // Populate the address (User) details
            .populate('orderItems.product') // Populate the product details in the orderItems array
           

            const user = await User.findById(order.address); // Using the address field which stores the userId
        
            if (!user) {
                return res.status(404).send('User not found');
            }
            const selectedAddressDocument = await Address.findOne(
                { "address._id": order.selectedAddress }, // Match the specific address ID
                { "address.$": 1 } // Project only the matching address element
            );
    
            if (!selectedAddressDocument || !selectedAddressDocument.address.length) {
                return res.status(404).send('Selected address not found in the Address document.');
            }
    
           
    
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

        

        res.render('admin/editOrder', { order ,addressDetails:selectedAddressDocument.address[0]});
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
        if (updatedStatus === 'Cancelled') {
            for (const item of order.orderItems) {
                const product = await Product.findById(item.product._id);
                if (product) {
                    product.quantity += item.quantity; // Restore the quantity
                    await product.save();
                }
            }
        }

        // Update the order status
        order.status = updatedStatus;
        await order.save();

       // res.status(200).json({ success: true, message: 'Order status updated successfully', order });

        // Redirect to the updated order details page
        //res.render('admin/orders',{order});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error updating order status');
    }

}
const getOrderslist = async (req, res) => {
    try {
        console.log("hi");
        const userId = req.session.user;  
        console.log("User ID:", userId);

        // Fetch user data
        const userData = await User.findById(userId); 

        // Fetch orders where address refers to the user
        const orders = await Order.find({ address: userId })
            .populate('orderItems.product', 'productName')  // Populate product details
            .sort({ createdOn: -1 });

        console.log("Order details:", orders);
  
        res.render('user/myOrders', { order: orders, username: userData.username });
    } catch (error) {
        console.log("Error while displaying user orders:", error);
        res.status(500).send('Error loading orders');
    }
};

const getCancelOrder = async(req,res)=>{
    try {
        const order = await Order.findById(req.params.id)
            .populate('address') // Populate the address (User) details
            .populate('orderItems.product') // Populate the product details in the orderItems array
            

            const user = await User.findById(order.address); // Using the address field which stores the userId
        
            if (!user) {
                return res.status(404).send('User not found');
            }

            const selectedAddressDocument = await Address.findOne(
                { "address._id": order.selectedAddress }, // Match the specific address ID
                { "address.$": 1 } // Project only the matching address element
            );
            console.log("here is ",selectedAddressDocument)

            if(!selectedAddressDocument || !selectedAddressDocument.address.length){
                return res.status(404).send('Selected address not found in the Address document.');

            }
            console.log("selected address from user side",selectedAddressDocument)
    
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

        

        res.render('user/cancelOrder', { order ,addressDetails:selectedAddressDocument.address[0],username:user.username});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching order details.');
    }
};
// const orderCancel = async(req,res)=>{
//     const orderId = req.params.id;
//     const { status } = req.body;
//     const userId = req.session.user;  // Ensure this contains the user's ID


//     try {
//         // Update the order status and add the cancellation reason
//         await Order.findByIdAndUpdate(orderId, {
//             status: status,
    
//         });
//         const userData = await User.findById(userId); 

//         // Fetch orders where address refers to the user
//         const orders = await Order.find({ address: userId })
//             .populate('orderItems.product', 'productName')  // Populate product details
//             .sort({ createdOn: -1 });
//         res.render('user/myOrders',{username:userData.username,order:orders}); // Redirect after successful update
//     } catch (error) {
//         console.error('Error updating order status:', error);
//         res.status(500).send('Internal Server Error');
//     }
// }
const orderCancel = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;
    const userId = req.session.user;  // Ensure this contains the user's ID

    try {
        // Fetch the order to get the order items
        const order = await Order.findById(orderId).populate('orderItems.product');
        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Restore the quantities of the products in the order
        for (const item of order.orderItems) {
            const product = await Product.findById(item.product._id);
            if (product) {
                product.quantity += item.quantity; // Restore the quantity
                await product.save();
            }
        }

        // Update the order status to cancelled
        order.status = status || 'Cancelled'; // Default status to 'Cancelled' if not provided
        await order.save();

        // Fetch updated user and order details
        const userData = await User.findById(userId);
        const orders = await Order.find({ address: userId })
            .populate('orderItems.product', 'productName')  // Populate product details
            .sort({ createdOn: -1 });

        // Render the updated orders view
        res.render('user/myOrders', {
            username: userData.username,
            order: orders,
        });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Internal Server Error');
    }
};
const returnOrder = async(req,res)=>{
    try {
        const orderId = req.params.id
        console.log(orderId)
        const{ status }=req.body
        const userId=req.session.user

        const order = await Order.findById(orderId).populate('orderItems.product')
        if(!order){
            return res.status(404).send("order not found")
        }

        for(const item of order.orderItems){
            const product = await Product.findById(item.product._id)
            if(product){
                product.quantity+=item.quantity;
                await product.save()
            }

        }
        order.status=status || 'Returned';
        await order.save()

        const userData = await User.findById(userId);
        const orders = await Order.find({address:userId})
        .populate('orderItems.product' ,'productName')
        .sort({createdOn:-1})

        res.render('user/myOrders',{order:orders,username:userData.username})

    } catch (error) {
        console.log("error in returning the product",error)
        res.status(500).send("server error")
    }
}



module.exports = {
    getAllOrders,
    deleteOrder,
    getEditOrder,
    updateStatus,
    getOrderslist,
    getCancelOrder,
    orderCancel,
    returnOrder
}