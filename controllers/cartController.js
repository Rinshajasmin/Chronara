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

    // Fetch the cart associated with the user
    const cart = await Cart.findOne({ userId})
        .populate('items.productId', 'productName salePrice regularPrice productImage') // Populate product details
        .exec();
        console.log("Cart details from user:", cart);


    if (!cart || cart.items.length === 0) {
        // return res.status(404).json({ message: "Cart is empty." });
        res.render('user/cart',{username:user.username})
    }

    // Format the cart details for the response
    const cartDetails = cart.items
    .filter(item => item.quantity > 0)  // Only include items with quantity greater than 0

    .map(item => ({
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
        data: cartDetails,grandTotal,username:user.username,cartId:cart._id
    });
} catch (error) {
    console.error("Error retrieving cart:", error);
    res.status(500).json({ message: "Error retrieving cart.", error: error.message });
}

}


const addToCart = async(req,res)=>{ 
  
    try {
    console.log("Starting to process add to cart...");
    const { productId } = req.body;
    const userId = req.session.user;

    if (!productId || !userId) {
        return res.status(400).json({ message: "Product ID and User ID are required." });
    }

    const product = await Product.findById(productId);
    if (!product) {
        return res.status(404).json({ message: "Product not found." });
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
        cart = new Cart({ userId, items: [] });
    }
    if (cart.items.length >= 3) {
        return res.status(400).json({ message: "You can only add up to 3 items in your cart." });
    }

    const existingItem = cart.items.find(item => item.productId.toString() === productId);
    if (existingItem) {
        if (existingItem.quantity < 3) {
            existingItem.quantity += 1;
            existingItem.totalPrice = existingItem.quantity * (product.salePrice || product.regularPrice);
        } else {
            return res.status(400).json({ message: "You cannot add more than 3 of this product." });
        }        
    } else {
        cart.items.push({
            productId,
            quantity: 1,
            price: product.salePrice || product.regularPrice,
            totalPrice: product.salePrice || product.regularPrice
        });
    }

    await cart.save();

    const populatedCart = await Cart.findOne({ userId })
        .populate('items.productId', 'productName category brand salePrice regularPrice productImage')
        .exec();

    const cartDetails = populatedCart.items.map(item => ({
        productId: item.productId._id,
        productName: item.productId.productName,
        productImage: item.productId.productImage[0],
        category: item.productId.category,
        brand: item.productId.brand,
        salePrice: item.productId.salePrice || item.productId.regularPrice,
        quantity: item.quantity,
        totalPrice: item.quantity * (item.productId.salePrice || item.productId.regularPrice),
    }));

    const grandTotal = cartDetails.reduce((acc, item) => acc + item.totalPrice, 0);

    const user = await User.findById(userId);  // Fetch the user details


    // res.render('user/addToCart', {
    //     data: cartDetails,
    //     grandTotal,
    //     cartId: cart._id,
    //     username: user.username,
    // });
    

    // res.render('user/addToCart')
    res.json({
        success: true,
        message: 'Item added to cart',
    })
} catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Error adding to cart.", error: error.message });
}
}

const changeQuantity = async (req, res) => {
    const { productId, quantity } = req.body;
  console.log(quantity)
    try {
        // Fetch the product to calculate price
        const product = await Product.findOne({ _id: productId });

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const price = product.salePrice || product.regularPrice;
        const totalPrice = price * quantity;

        if (quantity === 0) {
            // Remove item from the cart if quantity is 0
            const removedItem = await Cart.updateOne(
                { "items.productId": productId },
                { $pull: { items: { productId } } } // Pull item from cart
            );

            if (removedItem.modifiedCount > 0) {
                return res.json({
                    success: true,
                    message: "Item removed from cart",
                });
            } else {
                return res.status(400).json({ success: false, message: "Failed to remove item from cart" });
            }
        } else if (quantity > 0) {
            // Update item's quantity and total price
            const updatedItem = await Cart.updateOne(
                { "items.productId": productId },
                {
                    $set: {
                        "items.$.quantity": quantity,
                        "items.$.totalPrice": totalPrice,
                    },
                }
            );

            if (updatedItem.modifiedCount > 0) {
                return res.json({
                    success: true,
                    message: "Quantity updated successfully",
                    totalPrice,
                    quantity,
                });
            } else {
                return res.status(400).json({ success: false, message: "Failed to update quantity" });
            }
        } else {
            // Invalid quantity
            return res.status(400).json({
                success: false,
                message: "Quantity must be greater than or equal to 0",
            });
        }
    } catch (err) {
        console.error("Error in changeQuantity:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

    
const deleteProduct = async(req,res)=>{
    const mongoose = require('mongoose');

    try {
        const { productId } = req.body; // Retrieve productId from the request body
        const userId = req.session.user; // Assuming you're using session to identify the user
        console.log(typeof(productId)); // Check if it's a string (which is expected)
        console.log(userId)
        if (!productId || !userId) {
            return res.status(400).json({ success: false, message: "Product ID and User ID are required." });
        }
    
        // Convert productId to an ObjectId if it's a string
        const productObjectId = new mongoose.Types.ObjectId(productId);
        // Find the 's cart
        const cart = await Cart.findOne({ userId :userId});  // Correct query format { userId: userId }
        if (!cart) {

            console.log("Cart not found")
            return res.status(404).json({ success: false, message: 'Cart not found.' });
        }
    
        // Remove the product from the cart's items array
        const updatedCart = await Cart.updateOne(
            { userId, 'items.productId': productObjectId },  // Use ObjectId for comparison
            { $pull: { items: { productId: productObjectId } } }  // Remove item with the specific productId
        );
        console.log("Updated Cart:", updatedCart);

        await cart.save()
    
        if (updatedCart.modifiedCount > 0) {

            return res.json({ success: true, message: 'Product deleted from cart.' });
        } else {
            return res.status(400).json({ success: false, message: 'Failed to delete product from cart.' });
        }
        
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
            const userData=await User.findById(userId)
       
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
            const grandTotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
            
            res.render('user/checkOut', {
                items:cart.items,
                quantity:cart.quantity,
                addresses: addressDetails,
                cartId,
                totalPrice,
                grandTotal,
                username:userData.username
            });
            
        } catch (error) {
            console.error('Error loading checkout page:', error);
            res.status(500).send('Error loading checkout page.');
        }
    
    
}

const placeOrders = async (req, res) => {
    try {
        const { cartId, paymentMethod, address } = req.body;
        console.log("req.body while order placing", req.body);
        console.log('Payment Method:', paymentMethod);
        
        const userId = req.session.user;
        const userData = await User.findById(userId)
        
        // Fetch the cart using the cartId and populate the items with product details
        const cart = await Cart.findById(cartId).populate('items.productId');

        if (!cart) {
            return res.status(404).send('Cart not found');
        }
        const addressId =  new mongoose.Types.ObjectId(address);

        const selectedaddress1 = await Address.findOne(
            { userId, "address._id": addressId }, // Match userId and address._id
            { "address.$": 1 } // Project only the matching address element
        );
        console.log(selectedaddress1)
        // Calculate total price
        const totalPrice = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

        // Check stock for each product and update inventory
        for (const item of cart.items) {
            const product = await Product.findById(item.productId._id); // Find the product by its ID

            // If product is not found, throw an error
            if (!product) {
                return res.status(404).send(`Product not found: ${item.productId._id}`);
            }

            
             if (product.quantity < item.quantity) {
              console.log(product.quantity)
                console.log("item quantity",item.quantity)

              return res.status(400).send(`Not enough stock for ${product.productName}`);
            }

            // Decrease the product quantity by the ordered quantity
            product.quantity -= item.quantity;
            await product.save(); // Save the updated product
        }

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
            selectedAddress:addressId,
            address: userId,
            status: 'Pending', // Set initial status as 'Pending'
            paymentStatus: paymentMethod === 'Cash on Delivery' ?  'Pending':'Awaiting Payment',
            createdOn: new Date(), // Current date and time
        });

        // Save the new order to the database
        const savedOrder = await newOrder.save();

        // Optionally mark the cart as deleted or clear its items
         cart.items=[]
        await cart.save();
        if (paymentMethod !== "Cash on Delivery") {
            return res.redirect(`/user/getPaymentPage?orderId=${savedOrder._id}&amount=${savedOrder.finalAmount}`);
          }

        // Redirect to an order confirmation page or render a success page
        res.render('user/orderPlaced', {  
            orderId: savedOrder._id,  // Order ID
            totalPrice: savedOrder.totalPrice,  // Total price of the order
            paymentMethod: savedOrder.paymentMethod,  // Payment method
            createdOn: savedOrder.createdOn,
            ordernumber: savedOrder.orderId,
            username:userData.username
        });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).send('Server error');
    }
};



const razorpayPaymentSuccess = async(req,res)=>{

    
        try {
            // Capture query parameters from the GET request
            const { orderId, paymentId, paymentMethod } = req.query;
            console.log(orderId)
            
    
            // Fetch the order using the orderId from the database
            const order = await Order.findById(orderId)
                .populate('orderItems.product')  // Populate product details for each order item
                .exec();
    
            // If the order is not found, return an error
            if (!order) {
                return res.status(404).send('Order not found');
            }
            order.paymentStatus='Paid'
            await order.save()
    
            // Fetch the user who placed the order
            const userData = await User.findById(order.address);
    
            // Render the 'orderPlaced' page and pass the details, including order items and user info
            res.render('user/orderPlaced', {
                orderId: order._id,              // Order ID
                totalPrice: order.totalPrice,    // Total price of the order
                paymentMethod: paymentMethod,    // Payment method from the GET request
                paymentId: paymentId,            // Payment ID from Razorpay
                paymentStatus: 'Success',        // Payment status (can be dynamic based on the response)
                createdOn: order.createdOn,      // Order creation date
                orderItems: order.orderItems,    // Order items populated with product details
                username: userData.username,
                ordernumber:order.orderId      

            });
        } catch (error) {
            console.error('Error during Razorpay payment success:', error);
            res.status(500).send('Server error');
        }
    };
 
    







  
module.exports={
    getCartPage,
    addToCart,
    changeQuantity,
    deleteProduct,
    getCheckOut,
    placeOrders,
    razorpayPaymentSuccess
}