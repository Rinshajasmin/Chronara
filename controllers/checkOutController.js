const User = require("../models/usermodel");
const Product = require("../models/productSchema");
const Order = require("../models/orderSchema");
const Address = require("../models/addressmodel");
const Cart = require("../models/cartSchema");
const Wallet = require("../models/walletSchema");
const Category = require("../models/categorySchema");
const mongodb = require("mongodb");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const placeOrders = async (req, res) => {
    try {
      const {
        cartId,
        paymentMethod,
        address,
        totalSaved,
        discount,
        originalTotalPrice,
        finalTotal,
      } = req.body;
      console.log("req.body while order placing", req.body);
      console.log("Payment Method:", paymentMethod);
  
      const userId = req.session.user;
      const userData = await User.findById(userId);
  
      // Fetch the cart using the cartId and populate the items with product details
      const cart = await Cart.findById(cartId).populate("items.productId");
  
      if (!cart) {
        return res.status(404).send("Cart not found");
      }
  
      const addressId = new mongoose.Types.ObjectId(address);
  
      const selectedAddress = await Address.findOne(
        { userId, "address._id": addressId }, // Match userId and address._id
        { "address.$": 1 } // Project only the matching address element
      );
      console.log(selectedAddress);
  
      // Calculate total price
      const totalPrice = cart.items.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
      const grandTotal = cart.grandTotal;
      console.log(
        "grandtotal and totalPrice in order:::",
        grandTotal,
        totalPrice
      );
      const shippingCharge = 50.0;
      totalWithShipping = parseFloat(totalPrice + shippingCharge).toFixed(2);
  
      // Check stock for each product and update inventory
      for (const item of cart.items) {
        const product = await Product.findById(item.productId._id);
  
        // If product is not found, throw an error
        if (!product) {
          return res.status(404).send(`Product not found: ${item.productId._id}`);
        }
        // Decrease the product quantity by the ordered quantity
        product.quantity -= item.quantity;
        await product.save(); // Save the updated product
      }
  
      const couponApplied = cart.coupon && cart.coupon.code ? true : false;
      const couponCode = couponApplied ? cart.coupon.code : null;
  
      const totalDiscounts = parseFloat(totalSaved) + parseFloat(discount);
  
      // Create a new order
      const newOrder = new Order({
        orderItems: cart.items.map((item) => ({
          product: item.productId._id,
          quantity: item.quantity,
          price: item.price,
        })),
        totalPrice: totalPrice, // Use grandTotal from the cart
        finalAmount: finalTotal, // Adjust if there are discounts or other fees
        paymentMethod: paymentMethod,
        selectedAddress: addressId,
        address: userId,
        status: "Pending", // Set initial status as 'Pending'
        paymentStatus:
          paymentMethod === "Cash on Delivery" ? "Pending" : "Awaiting Payment", // Update to 'Paid' later if Wallet
        createdOn: new Date(), // Current date and time
        couponApplied, // Set the couponApplied field
        couponCode,
        discounts: totalDiscounts,
        originalTotalPrice,
      });
  
      // Save the new order to the database
      const savedOrder = await newOrder.save();
  
      const populatedOrder = await savedOrder.populate({
        path: "orderItems.product",
        select: "productName", // Specify the fields you want to populate
      });
  
      // If payment method is Wallet, check if the user has enough balance
      if (paymentMethod === "Wallet") {
        const wallet = await Wallet.findOne({ userId }); // Find the user's wallet
  
        if (!wallet) {
          return res.status(404).send("Wallet not found");
        }
  
        if (wallet.balance < savedOrder.finalAmount) {
          return res
            .status(400)
            .json({ success: false, message: "Insufficient wallet balance" });
        }
  
        // Deduct the total price from the wallet balance
        wallet.balance -= savedOrder.finalAmount;
        await wallet.save(); // Save the updated wallet balance
  
        // Log the wallet transaction as a Withdrawal
        const productNames = populatedOrder.orderItems
          .map((item) => item.product.productName)
          .join(", "); // Combine product names
        wallet.transactions.unshift({
          transactionId: uuidv4(),
          description: `Payment for ${productNames}`, // Access the populated product name
          type: "Withdrawal",
          amount: savedOrder.finalAmount,
          orderId: savedOrder._id,
          date: new Date(),
        });
  
        await wallet.save(); // Save the updated transaction log
  
        // Update the order payment status to "Paid"
        savedOrder.paymentStatus = "Paid";
        await savedOrder.save();
  
        cart.items = [];
        cart.coupon = { code: null, discount: 0 }; // Clear coupon data
        cart.grandTotal = 0;
        await cart.save();
      }
      // If payment method is Wallet, proceed with successful order placement
      if (paymentMethod === "Wallet") {
        return res.render("user/orderPlaced", {
          orderId: savedOrder._id,
          totalPrice: savedOrder.finalAmount,
          paymentMethod: savedOrder.paymentMethod,
          createdOn: savedOrder.createdOn,
          ordernumber: savedOrder.orderId,
          username: userData.username,
        });
      }
  
      // Redirect to payment page if payment method is not Wallet
      if (paymentMethod !== "Cash on Delivery") {
        cart.items = [];
        cart.coupon = { code: null, discount: 0 }; // Clear coupon data
        cart.grandTotal = 0;
        await cart.save();
        return res.redirect(
          `/user/getPaymentPage?orderId=${savedOrder._id}&amount=${savedOrder.finalAmount}`
        );
      }
  
      cart.items = [];
      cart.coupon = { code: null, discount: 0 }; // Clear coupon data
      cart.grandTotal = 0;
      await cart.save();
  
      // Redirect to an order confirmation page or render a success page
      res.render("user/orderPlaced", {
        orderId: savedOrder._id,
        totalPrice: savedOrder.finalAmount,
        paymentMethod: savedOrder.paymentMethod,
        createdOn: savedOrder.createdOn,
        ordernumber: savedOrder.orderId,
        username: userData.username,
        grandTotal: savedOrder.grandTotal,
      });
    } catch (error) {
      console.error("Error placing order:", error);
      res.status(500).send("Server error");
    }
  };

  
const razorpayPaymentSuccess = async (req, res) => {
    try {
      const { orderId, paymentId, paymentMethod } = req.query;
      console.log(orderId);
  
      const order = await Order.findById(orderId)
        .populate("orderItems.product") // Populate product details for each order item
        .exec();
  
      // If the order is not found, return an error
      if (!order) {
        return res.status(404).send("Order not found");
      }
      order.paymentStatus = "Paid";
      await order.save();
  
      // Fetch the user who placed the order
      const userData = await User.findById(order.address);
  
      // Render the 'orderPlaced' page and pass the details, including order items and user info
      res.render("user/orderPlaced", {
        orderId: order._id, // Order ID
        totalPrice: order.finalAmount, // Total price of the order
        paymentMethod: paymentMethod, // Payment method from the GET request
        paymentId: paymentId, // Payment ID from Razorpay
        paymentStatus: "Success", // Payment status (can be dynamic based on the response)
        createdOn: order.createdOn, // Order creation date
        orderItems: order.orderItems, // Order items populated with product details
        username: userData.username,
        ordernumber: order.orderId,
      });
    } catch (error) {
      console.error("Error during Razorpay payment success:", error);
      res.status(500).send("Server error");
    }
  };
  const getCheckOut = async (req, res) => {
    try {
      const { cartId, totalPrice } = req.body; // Retrieve cartId from request body
      const userId = req.session.user;
      const userWallet = await Wallet.findOne({ userId }); // Ensure proper query
      const walletBalance = userWallet ? userWallet.balance : 0;
  
      const cart = await Cart.findById(cartId).populate({
        path: "items.productId",
        populate: { path: "category", select: "categoryOffer" },
      });
  
      const userData = await User.findById(userId);
  
      if (!cart || cart.items.length === 0) {
        return res.redirect("/user/cart");
      }
  
      // Fetch the user's address details
      const user = await User.findById(userId).populate("addresses");
      const addressDetails = user.addresses.map((address) => ({
        ...address.toObject(),
        address: address.address.map((addr) => ({
          _id: addr._id,
          name: addr.name,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          landMark: addr.landMark,
          phone: addr.phone,
        })),
      }));
  
      let totalSaved = 0;
      let originalTotalPrice = 0; // To store the sum of original prices for all items
  
      // Calculate the total price, amount saved from offers, and the original total price
      const grandTotal = cart.items.reduce((acc, item) => {
        const product = item.productId;
        const categoryOffer = product.category?.categoryOffer || 0;
        const productOffer = product.productOffer || 0;
  
        // Sum of both offers
        const totalOffer = categoryOffer + productOffer;
        const discountAmount = (totalOffer / 100) * product.regularPrice;
  
        // Sale price after discount
        const salePrice = product.regularPrice - discountAmount;
  
        // Calculate original total (before discount)
        const originalTotal = product.regularPrice * item.quantity;
  
        // Accumulate the original total price
        originalTotalPrice += originalTotal;
  
        // Store originalTotal and totalPrice in the item
        item.originalTotal = originalTotal;
        item.totalPrice = salePrice * item.quantity;
  
        // Accumulate the total discount
        totalSaved += discountAmount * item.quantity;
  
        return acc + item.totalPrice; // Add item total price to grand total
      }, 0);
  
      const shoppingCharge = 50;
      // Calculate final total price after applying any coupon (if present)
      const discount = cart.coupon?.discount || 0; // Coupon discount (if any)
      const finalTotal = parseFloat(
        (grandTotal - discount + shoppingCharge).toFixed(2)
      );
  
      res.render("user/checkOut", {
        items: cart.items,
        quantity: cart.quantity,
        addresses: addressDetails,
        cartId,
        totalPrice,
        grandTotal,
        finalTotal,
        discount,
        totalSaved: parseFloat(totalSaved.toFixed(2)), // Pass the total amount saved from offers
        originalTotalPrice: parseFloat(originalTotalPrice.toFixed(2)), // Pass the sum of original prices
        username: userData.username,
        walletBalance,
      });
  
      console.log("Total Price:", totalPrice);
      console.log("Grand Total:", grandTotal);
      console.log("Original Total Price:", originalTotalPrice);
    } catch (error) {
      console.error("Error loading checkout page:", error);
      res.status(500).send("Error loading checkout page.");
    }
  };

  module.exports={placeOrders,razorpayPaymentSuccess,getCheckOut}