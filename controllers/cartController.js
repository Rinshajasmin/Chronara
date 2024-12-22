const User = require('../models/usermodel')
const Product = require("../models/productSchema");
const Order = require('../models/orderSchema')
const Address = require('../models/addressmodel')
const Cart = require('../models/cartSchema')
const mongodb = require("mongodb");
const mongoose = require('mongoose')


// const getCartPage = async (req, res) => {
//     const { ObjectId } = require('mongodb'); // Use MongoDB's ObjectId for type conversion

// try {
//     const userId = req.session.user; // Retrieve user ID from session
//     const user = await User.findById(userId).populate({
//         path: 'cart', // Populate the cart array
//         populate: {
//             path: 'items.productId', // Populate the productId within the items array
//             model: 'Product', // The Product model for the product details
//         },
//     });

//     // Check if the user exists and has a cart
//     if (!user || !user.cart || user.cart.length === 0) {
//         return res.render("user/cart", { user, quantity: 0, data: [], grandTotal: 0 });
//     }

//     let data = [];
//     user.cart.forEach((cartItem) => {
//         cartItem.items.forEach((item) => {
//             // Aggregate data from cart items
//             data.push({
//                 productImage: item.productId.productImage,
//                 productName: item.productId.productName,
//                 category: item.productId.category,
//                 brand: item.productId.brand,
//                 salePrice: item.productId.salePrice,
//                 quantity: item.quantity,
//                 totalPrice: item.quantity * item.productId.salePrice,
//             });
//         });
//     });

//     // Compute total quantity and grand total
//     let quantity = user.cart.reduce((sum, cartItem) => sum + cartItem.items.reduce((subSum, item) => subSum + item.quantity, 0), 0);
//     let grandTotal = data.reduce((sum, item) => sum + item.totalPrice, 0);

//     req.session.grandTotal = grandTotal; // Store grand total in session

//     // Render the cart page with the required data
//     res.render("user/cart", {
//         user,
//         quantity,
//         data,
//         grandTotal,
//     });
// } catch (error) {
//     console.error("Error rendering cart:", error);
//     res.redirect("/user/error"); // Redirect to an error page if there is a failure
// }

// }
//     const addToCart = async (req, res) => {
//         try {
//           const id = req.body.productId;
//           const userId = req.session.user;
//           const findUser = await User.findById(userId);
//           const product = await Product.findById({ _id: id }).lean();
          
//           if (!product) {
//             return res.json({ status: "Product not found" });
//           }
          
//           if (product.quantity <= 0) {
//             return res.json({ status: "Out of stock" });
//           }
      
//           const cartIndex = findUser.cart.findIndex((item) => item.productId == id);
      
//           if (cartIndex === -1) {
//             const quantity = 1;
//             await User.findByIdAndUpdate(userId, {
//               $addToSet: {
//                 cart: {
//                   productId: id,
//                   quantity: quantity,
//                 },
//               },
//             });
//             return res.json({ status: true, cartLength: findUser.cart.length + 1, user: userId });
//           } else {
//             const productInCart = findUser.cart[cartIndex];
//             if (productInCart.quantity < product.quantity) {
//               const newQuantity = productInCart.quantity + 1;
//               await User.updateOne(
//                 { _id: userId, "cart.productId": id },
//                 { $set: { "cart.$.quantity": newQuantity } }
//               );
//               return res.json({ status: true, cartLength: findUser.cart.length, user: userId });
//             } else {
//               return res.json({ status: "Out of stock" });
//             }
//           }
//         } catch (error) {
//           console.error(error);
//           return res.redirect("/pageNotFound");
//         }
//       };
 
const getCartPage = async(req,res)=>{
//     try {
//         const userId = req.session.user; // Assuming user ID is available in req.user
//         // const user = await User.findById(userId)
//         const user = await User.findById(userId);
// console.log("cart details:",user.cart);

//         // console.log('userid',user)
//         const cart = await Cart.findOne({ userId })
//             .populate('items.productId', 'productName salePrice regularPrice productImage') // Populate product details
//             .exec();

//         if (!cart || cart.items.length === 0) {
//             return res.status(404).json({ message: "Cart is empty." });
//         }

//         // Format response
//         const cartDetails = cart.items.map(item => ({
//             productId: item.productId._id,
//             productName: item.productId.productName,
//             salePrice: item.productId.salePrice || item.productId.regularPrice,
//             quantity: item.quantity,
//             totalPrice: item.totalPrice,
//             productImage: item.productId.productImage[0], // Assuming multiple images
//             status: item.status,
//         }));

//         res.render('user/cart',{message: "Cart details retrieved successfully.",
//             data: cartDetails,})
            
        
//     } catch (error) {
//         res.status(500).json({ message: "Error retrieving cart.", error: error.message });
//     }
// try {
//     const userId = req.session.user; // Ensure user ID is stored in session properly.
//     if (!userId) {
//         return res.status(400).json({ message: "User not logged in or session expired." });
//     }

//     // Fetch the user and their cart
//     const user = await User.findById(userId);
//     if (!user) {
//         return res.status(404).json({ message: "User not found." });
//     }
//     console.log("Cart details from user:", user.cart);

//     // Fetch the cart associated with the user
//     const cart = await Cart.findOne({ userId })
//         .populate('items.productId', 'productName salePrice regularPrice productImage') // Populate product details
//         .exec();

//     if (!cart || cart.items.length === 0) {
//         return res.status(404).json({ message: "Cart is empty." });
//     }

//     // Format the cart details for the response
//     const cartDetails = cart.items.map(item => ({
//         productId: item.productId._id,
//         productName: item.productId.productName,
//         salePrice: item.productId.salePrice || item.productId.regularPrice,
//         quantity: item.quantity,
//         totalPrice: item.quantity * (item.productId.salePrice || item.productId.regularPrice),
//         productImage: item.productId.productImage[0], // Assuming multiple images
//         status: item.status,
//     }));

//     // Render the cart page with the cart details
//     res.render('user/cart', {
//         message: "Cart details retrieved successfully.",
//         data: cartDetails,
//     });
// } catch (error) {
//     console.error("Error retrieving cart:", error);
//     res.status(500).json({ message: "Error retrieving cart.", error: error.message });
// }
try {
    const userId = req.session.user; // Ensure user ID is stored in session properly.
    if (!userId) {
        return res.status(400).json({ message: "User not logged in or session expired." });
    }

    // Fetch the user and their cart
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found." });
    }
    console.log("Cart details from user:", user.cart);

    // Fetch the cart associated with the user
    const cart = await Cart.findOne({ userId })
        .populate('items.productId', 'productName salePrice regularPrice productImage') // Populate product details
        .exec();

    if (!cart || cart.items.length === 0) {
        return res.status(404).json({ message: "Cart is empty." });
    }

    // Format the cart details for the response
    const cartDetails = cart.items.map(item => ({
        productId: item.productId._id,
        productName: item.productId.productName,
        salePrice: item.productId.salePrice || item.productId.regularPrice,
        quantity: item.quantity,
        totalPrice: item.quantity * (item.productId.salePrice || item.productId.regularPrice),
        productImage: item.productId.productImage[0], // Assuming multiple images
        status: item.status,
    }));
    const grandTotal = cartDetails.reduce((acc, item) => acc + item.totalPrice, 0);

    // Render the cart page with the cart details
    res.render('user/cart', {
        message: "Cart details retrieved successfully.",
        data: cartDetails,grandTotal
    });
} catch (error) {
    console.error("Error retrieving cart:", error);
    res.status(500).json({ message: "Error retrieving cart.", error: error.message });
}

}


const addToCart = async(req,res)=>{ 
    // try {
    //     const { productId} = req.body;
    //     const userId = req.session.user
    //     console.log(req.body)

    //     // Validate input
    //     if (!productId || !userId) {
    //         return res.status(400).json({ message: "Product ID and User ID are required." });
    //     }

    //     // Find the user's cart or create a new one if it doesn't exist
    //     let cart = await Cart.findOne({ userId });

    //     if (!cart) {
    //         cart = new Cart({ userId, items: [] });
    //     }

    //     // Check if the product already exists in the cart
    //     const existingItem = cart.items.find(item => item.productId.toString() === productId);

    //     if (existingItem) {
    //         // Update the quantity if the product is already in the cart
    //         existingItem.quantity += 1;
    //     } else {
    //         // Add the new product to the cart
    //         cart.items.push({ productId, quantity: 1 });
    //     }

    //     await cart.save();
    //      res.render('user/cart')
    //     // res.status(200).json({ message: "Item added to cart successfully!", cartLength: cart.items.length });
    // } catch (error) {
    //     console.error("Error adding to cart:", error);
    //     res.status(500).json({ message: "Error adding to cart.", error: error.message });
    // }
    try {
        const { productId } = req.body;
        const userId = req.session.user;
    
        console.log(req.body);
    
        // Validate input
        if (!productId || !userId) {
            return res.status(400).json({ message: "Product ID and User ID are required." });
        }
        const product = await Product.findById(productId);

        // Find the user's cart or create a new one if it doesn't exist
        let cart = await Cart.findOne({ userId });
    
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }
    
        // Check if the product already exists in the cart
        const existingItem = cart.items.find(item => item.productId.toString() === productId);
    
        if (existingItem) {
            // Update the quantity if the product is already in the cart
            existingItem.quantity += 1;
        } else {
            // Add the new product to the cart
            cart.items.push({ productId,
                 quantity: 1 ,
            
                price: product.salePrice || product.regularPrice,
                totalPrice: product.salePrice || product.regularPrice
            })
        }
    
        await cart.save();
    
        // Fetch the updated cart with product details
        const populatedCart = await Cart.findOne({ userId })
            .populate('items.productId', 'productName category brand salePrice regularPrice productImage')
            .exec();
    
        // Format the cart data for the view
        const cartDetails = populatedCart.items.map(item => ({
            
            productId: item.productId._id,
            productName: item.productId.productName,
            productImage: item.productId.productImage[0], // Assuming multiple images
            category: item.productId.category,
            brand: item.productId.brand,
            salePrice: item.productId.salePrice || item.productId.regularPrice,
            quantity: item.quantity,
            totalPrice: item.quantity * (item.productId.salePrice || item.productId.regularPrice),
            
        }));
        console.log("type of total price",typeof(totalPrice))

        console.log("cartdetails",cartDetails)


        cart.items = cartDetails.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.salePrice, // Updated sale price
            totalPrice: item.totalPrice, // Accurate total price
        }));

        await cart.save();
        const grandTotal = cartDetails.reduce((acc, item) => acc + item.totalPrice, 0);

console.log("Grand Total:", grandTotal);
        
    
        // Render the view and pass the formatted data
        res.render('user/cart', { data: cartDetails,grandTotal,cartId:cart._id });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ message: "Error adding to cart.", error: error.message });
    }
    
    

}

const changeQuantity = async(req,res)=>{
    // try {
    //     const id = req.body.productId;
    //     const user = req.session.user;
    //     const count = req.body.count;
    //     // count(-1,+1)
    //     const findUser = await User.findOne({ _id: user });
    //     const findProduct = await Product.findOne({ _id: id });
    //     const oid = new mongodb.ObjectId(user);
    //     if (findUser) {
    //       const productExistinCart = findUser.cart.find(
    //         (item) => item.productId === id
    //       );
    //       let newQuantity;
    //       if (productExistinCart) {
    //         if (count == 1) {
    //           newQuantity = productExistinCart.quantity + 1;
    //         } else if (count == -1) {
    //           newQuantity = productExistinCart.quantity - 1;
    //         } else {
    //           return res
    //             .status(400)
    //             .json({ status: false, error: "Invalid count" });
    //         }
    //       } else {
    //       }
    //       if (newQuantity > 0 && newQuantity <= findProduct.quantity) {
    //         let quantityUpdated = await User.updateOne(
    //           { _id: user, "cart.productId": id },
    //           {
    //             $set: {
    //               "cart.$.quantity": newQuantity,
    //             },
    //           }
    //         );
    //         const totalAmount = findProduct.salePrice * newQuantity;
    //         const grandTotal = await User.aggregate([
    //           { $match: { _id: oid } },
    //           { $unwind: "$cart" },
    //           {
    //             $project: {
    //               proId: { $toObjectId: "$cart.productId" },
    //               quantity: "$cart.quantity",
    //             },
    //           },
    //           {
    //             $lookup: {
    //               from: "products",
    //               localField: "proId",
    //               foreignField: "_id",
    //               as: "productDetails",
    //             },
    //           },
    //           {
    //             $unwind: "$productDetails", // Unwind the array created by the $lookup stage
    //           },
    
    //           {
    //             $group: {
    //               _id: null,
    //               totalQuantity: { $sum: "$quantity" },
    //               totalPrice: {
    //                 $sum: { $multiply: ["$quantity", "$productDetails.salePrice"] },
    //               }, 
    //             },
    //           },
    //         ]);
    //         if (quantityUpdated) {
    //           res.json({
    //             status: true,
    //             quantityInput: newQuantity,
    //             count: count,
    //             totalAmount: totalAmount,
    //             grandTotal: grandTotal[0].totalPrice,
    //           });
    //         } else {
    //           res.json({ status: false, error: "cart quantity is less" });
    //         }
    //       } else {
    //         res.json({ status: false, error: "out of stock" });
    //       }
    //     }
    //   } catch (error) {
    //     res.redirect("/pageNotFound");
    //     return res.status(500).json({ status: false, error: "Server error" });
    //   }

    const { productId, quantity } = req.body;
    console.log(req.body)
    console.log(typeof(quantity))

    try {
        // Fetch the product price from the database (assuming you have a Product model)
        const product = await Product.findOne({ _id: productId });
    
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
    
        const price = product.salePrice || product.regularPrice; // Choose correct price
        const totalPrice = (price * quantity) // Calculate total price
    
        // Update the quantity in the cart
        const updatedItem = await Cart.updateOne(
            { 'items.productId': productId },
            { 
                $set: { 
                    'items.$.quantity': quantity,
                    'items.$.totalPrice': totalPrice // Optionally store totalPrice in the database
                }
            }
        );
    
        if (updatedItem.nModified > 0) {
            return res.json({ 
                success: true, 
                message: 'Quantity updated', 
                totalPrice: totalPrice, 
                quantity: quantity 
            });
        } else {
            return res.status(400).json({ success: false, message: 'Failed to update quantity' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}    
    
const deleteProduct = async(req,res)=>{
    try{
    const { productId } = req.body; // Retrieve productId from the request body
        const userId = req.session.user; // Assuming you're using session to identify the user
        
        if (!productId || !userId) {
            return res.status(400).json({ success: false, message: "Product ID and User ID are required." });
        }

        // Find the user's cart
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }

        // Remove the product from the cart's items array
        const updatedCart = await Cart.updateOne(
            { userId, 'items.productId': productId },
            { $pull: { items: { productId } } } // Remove item with the specific productId
        );

        if (updatedCart.nModified > 0) {
            return res.render({ success: true, message: 'Product deleted from cart.' });
        } else {
            return res.status(400).json({ success: false, message: 'Failed to delete product from cart.' });
        }
    //  res.render('user/cart',{data:updatedCart})

    } catch (error) {
        console.error('Error deleting product from cart:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
const getCheckOut = async(req,res)=>{
    
        try {
            const { cartId,totalPrice } = req.body;  // Retrieve cartId from URL
            console.log(req.body)
            const userId = req.session.user
            const cart = await Cart.findById(cartId).populate('items.productId');
       
            if (!cart || cart.items.length === 0) {
                return res.redirect('/user/cart'); // Redirect to cart if it's empty
            }
            const user = await User.findById(userId).populate('addresses');
            const addressDetails = user.addresses.map(address => ({
                ...address.toObject(),
                address: address.address.map(addr => ({
                    _id: addr._id,
                    name: addr.name,
                    city: addr.city,
                    state: addr.state,
                    pincode: addr.pincode,
                    landMark: addr.landMark,
                    phone: addr.phone
                }))
            }));
            
            res.render('user/checkOut', {
                items:cart.items,
                addresses: addressDetails,
                cartId,
                totalPrice
            });
            
        } catch (error) {
            console.error('Error loading checkout page:', error);
            res.status(500).send('Error loading checkout page.');
        }
    
    
}

const placeOrders = async(req,res)=>{
    try {
        const { cartId, paymentMethod,address} = req.body;
        console.log('Payment Method:', paymentMethod);
   const userId=req.session.user
        // Fetch the cart using the cartId
        const cart = await Cart.findById(cartId).populate('items.productId');

        if (!cart) {
            return res.status(404).send('Cart not found');
        }


        // Calculate total price
        const totalPrice = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

        // Create a new order
        const newOrder = new Order({
            orderItems: cart.items.map(item => ({
                product: item.productId._id,
                quantity: item.quantity,
                price: item.price,
            })),
            totalPrice: totalPrice,
            finalAmount: totalPrice, // Adjust if there are discounts or other fees
            paymentMethod: paymentMethod,
            address:userId,
            status: 'Pending', // Set initial status as 'Pending'
            createdOn: new Date(), // Current date and time
        });

        // Save the new order to the database
        const savedOrder = await newOrder.save();

        // Optionally mark the cart as deleted or clear its items
        // cart.isDeleted = true; // Mark the cart as deleted
        //await cart.save();

        // Redirect to an order confirmation page or render a success page
        res.render('user/orderPlaced', {  orderId: savedOrder._id,  // Order ID
            totalPrice: savedOrder.totalPrice,  // Total price of the order
            paymentMethod: savedOrder.paymentMethod,  // Payment method
            createdOn: savedOrder.createdOn,
            ordernumber:savedOrder.orderId
        });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).send('Server error');
    }
}






  
module.exports={
    getCartPage,
    addToCart,
    changeQuantity,
    deleteProduct,
    getCheckOut,
    placeOrders
}