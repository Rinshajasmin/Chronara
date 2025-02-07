const User = require('../models/usermodel')
const Product = require("../models/productSchema");
const Order = require('../models/orderSchema')
const Address = require('../models/addressmodel')
const Cart = require('../models/cartSchema')
const Wallet = require('../models/walletSchema')
const mongodb = require("mongodb");
const mongoose = require('mongoose');
const shortid = require('shortid');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const moment = require('moment');
const Coupon = require('../models/couponSchema');

//admin side
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
      .populate("address") // Populate the address (User) details
      .populate("orderItems.product"); // Populate the product details in the orderItems array

    const user = await User.findById(order.address); // Using the address field which stores the userId

    if (!user) {
      return res.status(404).send("User not found");
    }
    const selectedAddressDocument = await Address.findOne(
      { "address._id": order.selectedAddress }, // Match the specific address ID
      { "address.$": 1 } // Project only the matching address element
    );

    if (!selectedAddressDocument || !selectedAddressDocument.address.length) {
      return res
        .status(404)
        .send("Selected address not found in the Address document.");
    }

    if (!order) {
      return res.status(404).send("Order not found");
    }
    order.orderItems.forEach((item) => {
      item.totalPrice = item.quantity * item.price; // Calculate totalPrice for each item
    });

    // Calculate the total order amount
    const totalOrderPrice = order.orderItems.reduce(
      (acc, item) => acc + item.totalPrice,
      0
    );

    // Add the totalOrderPrice to the order object
    order.totalOrderPrice = totalOrderPrice;

    let couponDiscount = 0;
    if (order.couponApplied && order.couponCode) {
      const appliedCoupon = await Coupon.findOne({ name: order.couponCode });

      if (appliedCoupon) {
        couponDiscount = parseFloat(appliedCoupon.offerPrice).toFixed(2);
      }
    }

    res.render("admin/editOrder", {
      order,
      addressDetails: selectedAddressDocument.address[0],
      couponDiscount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching order details.");
  }
};
const updateStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const updatedStatus = req.body.status;
    console.log(orderId);
    console.log(updatedStatus);

    // Find the order by ID and update the status
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status: updatedStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).send("Order not found");
    }
    if (updatedStatus === "Cancelled") {
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
    res.status(500).send("Error updating order status");
  }
};
const getOrderslist = async (req, res) => {
    try {
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
        
        let couponDiscount = 0;
        if (order.couponApplied && order.couponCode) {
            const appliedCoupon = await Coupon.findOne({name:order.couponCode})

            if(appliedCoupon){
                couponDiscount=parseFloat(appliedCoupon.offerPrice).toFixed(2)
            }
        }
    res.render('user/orderDetails', { order ,addressDetails:selectedAddressDocument.address[0],username:user.username,couponDiscount});
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching order details.');
    }
};

const orderCancel = async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;
    const user = req.session.user; // Get user object from session
    const userId = user._id; // Extract the user ID (ObjectId)

    try {
        // Fetch the order to get the order items
        const order = await Order.findById(orderId).populate('orderItems.product','productName');
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
        order.status = status || 'Cancelled'; // Default status to 'Cancelled' if not provided
        await order.save();

        const wallet = await Wallet.findOne({userId})
        if(!wallet){
            return res.status(400).send("wallet not find")
        }
        

        const refundAmount = order.finalAmount;
        wallet.balance+=refundAmount;
         // Add a refund transaction to the wallet
         const productNames = order.orderItems
         .map(item => item.product.productName) // Extract product names
         .join(', '); // Create a comma-separated string
     
     wallet.transactions.unshift({
         transactionId:uuidv4(), // Unique transaction ID
         description: `Refund for cancelled order: ${productNames}`, // Include product names
         type: 'Deposit',
         amount: refundAmount,
         orderId, // Reference to the cancelled order
         date: new Date(),
     });
        // Save the updated wallet
        await wallet.save();
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
        const user = req.session.user; // Get user object from session
        const userId = user._id; // Extract the user ID (ObjectId)
    
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

        const wallet = await Wallet.findOne({userId})
        if(!wallet){
            return res.status(400).send("wallet not find")
        }
        

        const refundAmount = order.finalAmount;
        wallet.balance+=refundAmount;
         // Add a refund transaction to the wallet
         const productNames = order.orderItems
         .map(item => item.product.productName) // Extract product names
         .join(', '); // Create a comma-separated string
     
     wallet.transactions.unshift({
         transactionId:uuidv4(), // Unique transaction ID
         description: `Refund for Returned order: ${productNames}`, // Include product names
         type: 'Deposit',
         amount: refundAmount,
         orderId, // Reference to the cancelled order
         date: new Date(),
     });
        // Save the updated wallet
        await wallet.save();


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
const completeFailedPayment = async (req, res) => {
    try {
        const orderId = req.params.id;
        const { paymentMethod } = req.body; 
        
        console.log("Payment Method:", paymentMethod);

        const order = await Order.findById(orderId).populate({
            path: 'orderItems.product', // Assuming `productId` is the field in `orderItems`
            select: 'productName' // Only fetch the `name` field from the Product schema
        });        if (!order) {
            return res.status(404).send('Order not found');
        }
        const {  finalAmount, paymentStatus } = order;

        console.log("Order Details:", order);
        if (paymentStatus === 'Paid') {
            return res.status(400).json({ success: false, message: 'Payment has already been completed for this order' });
        }

        // Process payment based on the selected payment method
        if (paymentMethod === 'Wallet') {
            const userId = req.session.user; // Assuming user session contains the logged-in user's ID
            const wallet = await Wallet.findOne({ userId });

            if (!wallet) {
                return res.status(404).json({ success: false, message: 'Wallet not found' });
            }

            if (wallet.balance < finalAmount) {
                return res.json({ success: false, message: 'Insufficient wallet balance' });
            }

            // Deduct the amount from the wallet
            wallet.balance -= finalAmount;
            wallet.transactions.unshift({
                transactionId: uuidv4(),
                description: `Payment for: ${order.orderItems
                    .map(item => item.product.productName) // Extract product names
                    .join(', ')}`, // Join product names with `,
                type: 'Withdrawal',
                amount: finalAmount,
                date: new Date(),
            });
            await wallet.save();

            // Update the order payment status to "Paid"
            order.paymentMethod ='Wallet'
            order.paymentStatus = 'Paid';
            order.status = 'Pending'; // Update status to processing or any relevant status
            await order.save();

            return res.json({ success: true, message: 'Payment completed successfully using Wallet' });
        } else if (paymentMethod === 'Razorpay') {
            // Redirect to an online payment gateway (e.g., Razorpay, PayPal)

             return res.redirect(`/user/getPaymentPage?orderId=${orderId}&amount=${finalAmount}`);
        } else if (paymentMethod === 'Cash on Delivery') {
            // Update the order payment status for COD
            order.paymentStatus = 'Pending';
            order.paymentMethod = 'Cash on Delivery'
            order.status = 'Pending'; // Update status accordingly
            await order.save();

            return res.status(200).json({success:true,message:'Order confirmed with Cash on Delivery'});
        } else {
            return res.status(400).json({success:false,message:'Invalid payment method selected'});
        }
    } catch (error) {
        console.error('Error completing payment:', error);
        res.status(500).send('Server error');
    }
};

const invoiceDownload = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).populate("orderItems.product");

    if (!order) {
      return res.status(404).send("Order not found");
    }
    const doc = new PDFDocument({ margin: 50 });

    // Set headers for the response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${order.orderId}.pdf`
    );
    // Pipe the document to the response
    doc.pipe(res);
    doc

      .fontSize(20)
      .text("Chronara Pvt Ltd.", 50, 50)
      .fontSize(10)
      .text("123 Main Street", 50, 75)
      .text("Bangalore, Karnataka, 10025", 50, 90)
      .moveDown();

    // Invoice header
    doc.fontSize(20).text("Invoice", 50, 150).moveDown();

    // Invoice details
    const formattedDate = moment(order.createdOn).format(
      "DD MMMM YYYY, hh:mm A"
    );
    const finalTotal = order.finalAmount.toFixed(2);
    doc

      .fontSize(10)
      .text(`Order Number: ${order.orderId}`, 50, 200)
      .text(`Invoice Date: ${formattedDate}`, 50, 215)
      .text(`Balance Due: ${finalTotal}`, 50, 230);
   
    // Table header
    const tableTop = 300;
    doc
      .fontSize(10)
      .text("NO:", 50, tableTop)
      .text("Item", 150, tableTop)
      .text("Unit Cost", 270, tableTop) // Shifted slightly to the left
      .text("Offer Price", 350, tableTop) // New column
      .text("Quantity", 420, tableTop) // Adjusted positions
      .text("Total", 500, tableTop); // Adjusted positions

    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .stroke();

    // Add order items
    let y = tableTop + 25;
    order.orderItems.forEach((item, index) => {
      const unitPrice = item.product.regularPrice.toFixed(2); // Format unit price
      const offerPrice = item.price.toFixed(2); // Fallback if salePrice is missing
      const lineTotal = (item.price * item.quantity).toFixed(2); // Calculate total with offer price

      doc
        .text((index + 1).toString(), 50, y) // Serial number
        .text(item.product.productName, 150, y) // Product name
        .text(`${unitPrice}`, 270, y) // Unit price
        .text(`${offerPrice}`, 350, y) // Offer price
        .text(item.quantity.toString(), 420, y) // Quantity
        .text(`${lineTotal}`, 500, y); // Total

      y += 20; // Move to the next row
    });
    // Add total summary
    doc;
    doc
      .moveTo(50, y + 10)
      .lineTo(550, y + 10)
      .stroke();

    let couponDiscount = 0;
    if (order.couponApplied && order.couponCode) {
      const appliedCoupon = await Coupon.findOne({ name: order.couponCode });
      if (appliedCoupon) {
        couponDiscount = parseFloat(appliedCoupon.offerPrice).toFixed(2) || 0;
      }
    }
    const discounted = parseFloat(order.discounts - couponDiscount).toFixed(2);
    const formattedTotal = order.totalPrice.toFixed(2);
    doc 
      .fontSize(10)
      .text(`Offer Discount: ${discounted}`, 400, y + 35)
      .text(`Coupon Discount: ${couponDiscount}`, 400, y + 50) // New coupon discount line
      .text(`Subtotal: ${formattedTotal}`, 400, y + 70) // Adjust y offset as needed
      .text(`Shipping: 50.00`, 400, y + 90)
      .font("Helvetica-Bold")
      .text(`Total: ${finalTotal}`, 400, y + 110);
    doc.fontSize(10).text("Thank you for your purchase!", 50, y + 100, {   // Footer

      align: "left",
      width: 500,
    });
    doc.end();//finalize pdf
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).send("Server error");
  }
};
module.exports = {
    getAllOrders,deleteOrder,getEditOrder,updateStatus,getOrderslist,  getCancelOrder,orderCancel,returnOrder,completeFailedPayment,invoiceDownload
}