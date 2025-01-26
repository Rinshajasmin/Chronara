const User = require('../models/usermodel')
const Product = require("../models/productSchema");
const Order = require('../models/orderSchema')
const Address = require('../models/addressmodel')
const Cart = require('../models/cartSchema')
const Wallet = require('../models/walletSchema')
const Category = require('../models/categorySchema')
const mongodb = require("mongodb");
const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid');



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
 
// const getCartPage = async(req,res)=>{

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

//     // Fetch the cart associated with the user
//     const cart = await Cart.findOne({ userId})
//         .populate('items.productId', 'productName productOffer regularPrice productImage') // Populate product details
//         .exec();
//         console.log("Cart details from user:", cart);


//     if (!cart || cart.items.length === 0) {
//         // return res.status(404).json({ message: "Cart is empty." });
//         res.render('user/cart',{username:user.username})
//     }

//     // Format the cart details for the response
//     const cartDetails = cart.items
//     .filter(item => item.quantity > 0)  // Only include items with quantity greater than 0

//     .map(item => ({
//         productId: item.productId._id,
//         productName: item.productId.productName,
//         salePrice: item.productId.regularPrice,
//         quantity: item.quantity,
//         totalPrice: item.quantity * item.productId.regularPrice,
//         productImage: item.productId.productImage[0], // Assuming multiple images
//         status: item.status,
        
//     }));
//     const grandTotal = cartDetails.reduce((acc, item) => acc + item.totalPrice, 0);

//     // Render the cart page with the cart details
//     res.render('user/cart', {
//         message: "Cart details retrieved successfully.",
//         data: cartDetails,grandTotal,username:user.username,cartId:cart._id
//     });
// } catch (error) {
//     console.error("Error retrieving cart:", error);
//     res.status(500).json({ message: "Error retrieving cart.", error: error.message });
// }

// }
const getCartPage = async (req, res) => {
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
        const cart = await Cart.findOne({ userId })
            .populate({
                path: 'items.productId',
                select: 'productName productOffer regularPrice productImage category',
                populate: { path: 'category', select: 'categoryOffer' } // Populate category offer
            })
            .exec();

        console.log("Cart details from user:", cart);

        if (!cart || cart.items.length === 0) {
            return res.render('user/cart', { username: user.username });
        }

        // Format the cart details for the response
        const cartDetails = cart.items
            .filter(item => item.quantity > 0) // Only include items with quantity greater than 0
            .map(item => {
                const salePrice = calculateSalePrice(item.productId); // Calculate the sale price dynamically
                const categoryOffer = item.productId.category?.categoryOffer || 0;
                const productOffer = item.productId.productOffer || 0;
                const totalOffer = categoryOffer + productOffer;
                const actualTotal = item.productId.regularPrice*item.quantity;
                const OfferDiscount = actualTotal - salePrice

                return {
                    productId: item.productId._id,
                    productName: item.productId.productName,
                    regularPrice: (item.productId.regularPrice).toFixed(2),
                    salePrice: salePrice.toFixed(2), 
                    quantity: item.quantity,
                    totalPrice: (item.quantity * salePrice).toFixed(2), // Use sale price for total price
                    productImage: item.productId.productImage[0], // Assuming multiple images
                    status: item.status,
                    totalOffer,
                    actualTotal,
                    OfferDiscount
                };
            });
            

            const shippingCharge=50.00
            const grandTotal = cartDetails
            .reduce((acc, item) => acc + parseFloat(item.totalPrice), 0)
            .toFixed(2);       
             const actualCartTotal = cartDetails.reduce((acc, item) => acc +parseFloat (item.actualTotal), 0).toFixed(2);
        const actualCartOfferDiscount = cartDetails.reduce((acc,item)=>acc + parseFloat(item.OfferDiscount),0).toFixed(2);
        const netQuantity = cartDetails.length;
        const  totalWithShipping = (parseFloat(grandTotal)+shippingCharge).toFixed(2)


         console.log("cart details",cartDetails);
         
        res.render('user/cart', {
            message: "Cart details retrieved successfully.",
            data: cartDetails,
            grandTotal:totalWithShipping ,
            actualCartTotal,
            actualCartOfferDiscount,
            netQuantity,
            shippingCharge:shippingCharge,
            username: user.username,
            cartId: cart._id,
        });
    } catch (error) {
        console.error("Error retrieving cart:", error);
        res.status(500).json({ message: "Error retrieving cart.", error: error.message });
    }
};




// const addToCart = async(req,res)=>{ 
  
//     try {
//     console.log("Starting to process add to cart...");
//     const { productId } = req.body;
//     const userId = req.session.user;

//     if (!productId || !userId) {
//         return res.status(400).json({ message: "Product ID and User ID are required." });
//     }

//     const product = await Product.findById(productId);
//     if (!product) {
//         return res.status(404).json({ message: "Product not found." });
//     }

//     let cart = await Cart.findOne({ userId });
//     if (!cart) {
//         cart = new Cart({ userId, items: [] });
//     }
//     if (cart.items.length >= 3) {
//         return res.status(400).json({ message: "You can only add up to 3 items in your cart." });
//     }

//     const existingItem = cart.items.find(item => item.productId.toString() === productId);
//     if (existingItem) {
//         if (existingItem.quantity < 3) {
//             existingItem.quantity += 1;
//             existingItem.totalPrice = existingItem.quantity * (product.salePrice || product.regularPrice);
//         } else {
//             return res.status(400).json({ message: "You cannot add more than 3 of this product." });
//         }        
//     } else {
//         cart.items.push({
//             productId,
//             quantity: 1,
//             price: product.salePrice || product.regularPrice,
//             totalPrice: product.salePrice || product.regularPrice
//         });
//     }

//     await cart.save();

//     const populatedCart = await Cart.findOne({ userId })
//         .populate('items.productId', 'productName category brand salePrice regularPrice productImage totalPrice')
//         .exec();

//     const cartDetails = populatedCart.items.map(item => ({
//         productId: item.productId._id,
//         productName: item.productId.productName,
//         productImage: item.productId.productImage[0],
//         category: item.productId.category,
//         brand: item.productId.brand,
//         salePrice: item.productId.regularPrice,
//         quantity: item.quantity,
//         totalPrice: item.quantity * (item.productId.regularPrice),
//     }));

//     const grandTotal = cartDetails.reduce((acc, item) => acc + item.totalPrice, 0);

//     const user = await User.findById(userId);  // Fetch the user details


//     // res.render('user/addToCart', {
//     //     data: cartDetails,
//     //     grandTotal,
//     //     cartId: cart._id,
//     //     username: user.username,
//     // });
    

//     // res.render('user/addToCart')
//     res.json({
//         success: true,
//         message: 'Item added to cart',
//     })
// } catch (error) {
//     console.error("Error adding to cart:", error);
//     res.status(500).json({ message: "Error adding to cart.", error: error.message });
// }
// }

// Utility function to calculate salePrice
function calculateSalePrice(product) {
    const categoryOffer = product.category?.categoryOffer || 0; // Default to 0 if no category offer
    const productOffer = product.productOffer || 0; // Default to 0 if no product offer
    const totalOffer = categoryOffer + productOffer; // Sum of both offers
    const regularPrice = product.regularPrice; // Regular price of the product
    const discountAmount = (totalOffer / 100) * regularPrice; // Calculate discount amount
    return regularPrice - discountAmount; // Sale price after applying the discount
}
const checkProductStock = async (productId, requestedQuantity) => {
    try {
        const product = await Product.findById(productId);

        if (!product) {
            return { success: false, message: "Product not found." };
        }

        if (product.quantity < 1) {
            return { success: false, message: `No enough stock available.` };
        }

        return { success: true };
    } catch (error) {
        console.error("Error checking product stock:", error);
        return { success: false, message: "Error checking product stock." };
    }
};




// const addToCart = async (req, res) => {
//     try {
//         console.log("Starting to process add to cart...");
//         const { productId } = req.body;
//         const userId = req.session.user;

//         if (!productId || !userId) {
//             return res.status(400).json({ message: "Product ID and User ID are required." });
//         }

//         const product = await Product.findById(productId).populate("category", "categoryOffer");
//         if (!product) {
//             return res.status(404).json({ message: "Product not found." });
//         }

//         const salePrice = calculateSalePrice(product);
//         console.log("calculated saleprice:",salePrice)

//         let cart = await Cart.findOne({ userId });
//         if (!cart) {
//             cart = new Cart({ userId, items: [] });
//         }

//         if (cart.items.length >= 3) {
//             return res.status(400).json({ message: "You can only add up to 3 items in your cart." });
//         }

//         const existingItem = cart.items.find(item => item.productId.toString() === productId);
//         if (existingItem) {
//             if (existingItem.quantity < 3) {
//                 existingItem.quantity += 1;
//                 existingItem.totalPrice = existingItem.quantity * salePrice;
//             } else {
//                 return res.status(400).json({ message: "You cannot add more than 3 of this product." });
//             }
//         } else {
//             cart.items.push({
//                 productId,
//                 quantity: 1,
//                 price: salePrice,
//                 totalPrice: salePrice,
//             });
//         }

//         await cart.save();

//         const populatedCart = await Cart.findOne({ userId })
//         .populate({
//             path: 'items.productId',
//             select: 'productName category brand salePrice regularPrice productImage productOffer',
//             populate: { path: 'category', select: 'categoryOffer' }, // Populate categoryOffer as well
//         })
//         .exec();
    
//     const cartDetails = populatedCart.items.map(item => {
//         const dynamicSalePrice = calculateSalePrice(item.productId); // Recalculate salePrice dynamically
//         console.log('dynamic', dynamicSalePrice);
    
//         return {
//             productId: item.productId._id,
//             productName: item.productId.productName,
//             productImage: item.productId.productImage[0],
//             category: item.productId.category,
//             brand: item.productId.brand,
//             salePrice: dynamicSalePrice,
//             quantity: item.quantity,
//             totalPrice: item.quantity * dynamicSalePrice,
//         };
//     });
    

//         const grandTotal = cartDetails.reduce((acc, item) => acc + item.totalPrice, 0);
//        // console.log('dynamic',dynamicSalePrice)

//         const user = await User.findById(userId); // Fetch the user details

//         res.json({
//             success: true,
//             message: 'Item added to cart',
//             data: cartDetails,
//             grandTotal,
//         });
//     } catch (error) {
//         console.error("Error adding to cart:", error);
//         res.status(500).json({ message: "Error adding to cart.", error: error.message });
//     }
// };


// const changeQuantity = async (req, res) => {
//     const { productId, quantity } = req.body;
//   console.log(quantity)
//     try {
//         // Fetch the product to calculate price
//         const product = await Product.findOne({ _id: productId });

//         if (!product) {
//             return res.status(404).json({ success: false, message: "Product not found" });
//         }

//         const price = product.regularPrice;
//         const totalPrice = price * quantity;

//         if (quantity === 0) {
//             // Remove item from the cart if quantity is 0
//             const removedItem = await Cart.updateOne(
//                 { "items.productId": productId },
//                 { $pull: { items: { productId } } } // Pull item from cart
//             );

//             if (removedItem.modifiedCount > 0) {
//                 return res.json({
//                     success: true,
//                     message: "Item removed from cart",
//                 });
//             } else {
//                 return res.status(400).json({ success: false, message: "Failed to remove item from cart" });
//             }
//         } else if (quantity > 0) {
//             // Update item's quantity and total price
//             const updatedItem = await Cart.updateOne(
//                 { "items.productId": productId },
//                 {
//                     $set: {
//                         "items.$.quantity": quantity,
//                         "items.$.totalPrice": totalPrice,
//                     },
//                 }
//             );

//             if (updatedItem.modifiedCount > 0) {
//                 return res.json({
//                     success: true,
//                     message: "Quantity updated successfully",
//                     totalPrice,
//                     quantity,
//                 });
//             } else {
//                 return res.status(400).json({ success: false, message: "Failed to update quantity" });
//             }
//         } else {
//             // Invalid quantity
//             return res.status(400).json({
//                 success: false,
//                 message: "Quantity must be greater than or equal to 0",
//             });
//         }
//     } catch (err) {
//         console.error("Error in changeQuantity:", err);
//         return res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };


const addToCart = async (req, res) => {
    try {
        console.log("Starting to process add to cart...");
        const { productId } = req.body;
        const userId = req.session.user;

        if (!productId || !userId) {
            return res.status(400).json({ message: "Product ID and User ID are required." });
        }

        const product = await Product.findById(productId).populate("category", "categoryOffer");
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        const salePrice = calculateSalePrice(product);
        console.log("calculated saleprice:", salePrice);

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        if (cart.items.length >= 3) {
            return res.status(400).json({ message: "You can only add up to 3 items in your cart." });
        }

        const existingItem = cart.items.find(item => item.productId.toString() === productId);

        if (existingItem) {
            const requestedQuantity = existingItem.quantity + 1;
        
            // Check if enough stock is available
            const stockCheck = await checkProductStock(productId, requestedQuantity);
            if (!stockCheck.success) {
                return res.status(400).json({ message: stockCheck.message });
            }
        
            if (existingItem.quantity < 3) {
                existingItem.quantity += 1;
                existingItem.totalPrice = existingItem.quantity * salePrice;
                
        
                // Decrease stock in the Product collection
                product.quantity -= 1;
                await product.save();
            } else {
                return res.status(400).json({ message: "You cannot add more than 3 of this product." });
            }
        } else {
            const stockCheck = await checkProductStock(productId, 1);
            if (!stockCheck.success) {
                return res.status(400).json({ message: stockCheck.message });
            }
        
            cart.items.push({
                productId,
                quantity: 1,
                price: salePrice,
                totalPrice: salePrice,
                
            });
        
            // Decrease stock in the Product collection
            product.quantity -= 1;
            await product.save();
        }

        await cart.save();

        const populatedCart = await Cart.findOne({ userId })
            .populate({
                path: "items.productId",
                select: "productName category brand salePrice regularPrice productImage productOffer",
                populate: { path: "category", select: "categoryOffer" },
            })
            .exec();

        const cartDetails = populatedCart.items.map(item => {
            const dynamicSalePrice = calculateSalePrice(item.productId);
            
            const discount = cart.coupon?.discount || 0
            console.log("discount in the cart",discount)


            return {
                productId: item.productId._id,
                productName: item.productId.productName,
                productImage: item.productId.productImage[0],
                category: item.productId.category,
                brand: item.productId.brand,
                salePrice: dynamicSalePrice,
                quantity: item.quantity,
                totalPrice: item.quantity * dynamicSalePrice,
                discount,
            
            };
        });
        console.log("Final Response Data:", cartDetails);

        const shippingCharge = 50.00
        const grandTotal = cartDetails.reduce((acc, item) => acc + item.totalPrice, 0);
        const actualCartTotal = cartDetails.reduce((acc,item)=>acc+item.actualTotal,0)
        const  totalWithShipping = (parseFloat(grandTotal)+shippingCharge).toFixed(2)

        res.json({
            success: true,
            message: "Item added to cart",
            data: cartDetails,
            grandTotal:totalWithShipping,
            actualCartTotal
        });
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).json({ message: "Error adding to cart.", error: error.message });
    }
};




// const changeQuantity = async (req, res) => {
//     const { productId, quantity } = req.body;
//     console.log(quantity);

//     try {
//         // Fetch the product and its category to calculate the sale price
//         const product = await Product.findOne({ _id: productId }).populate("category", "categoryOffer");

//         if (!product) {
//             return res.status(404).json({ success: false, message: "Product not found" });
//         }
        
//           // Check stock availability
//           if (quantity > product.quantity) {
//             return res.status(200).json({
//                 success: false,
//                 message: 'Not enough stock available',
//                 availableStock: product.quantity, // Optionally include available stock
//             });
//         }

        

//         // Calculate sale price
//         const salePrice = calculateSalePrice(product); // Use the function to calculate sale price
//         const totalPrice = salePrice * quantity;

//         if (quantity === 0) {
//             // Remove item from the cart if quantity is 0
//             const removedItem = await Cart.updateOne(
//                 { "items.productId": productId },
//                 { $pull: { items: { productId } } } // Pull item from cart
//             );
            

//             if (removedItem.modifiedCount > 0) {
//                 return res.json({
//                     success: true,
//                     message: "Item removed from cart",
//                 });
//             } else {
//                 return res.status(400).json({ success: false, message: "Failed to remove item from cart" });
//             }
//         } else if (quantity > 0 ) {
//             // Update item's quantity and total price
//             const updatedItem = await Cart.updateOne(
//                 { "items.productId": productId },
//                 {
//                     $set: {
//                         "items.$.quantity": quantity,
//                         "items.$.price": salePrice, // Update the sale price
//                         "items.$.totalPrice": totalPrice,
//                     },
//                 }
//             );

//             if (updatedItem.modifiedCount > 0) {
//                 return res.json({
//                     success: true,
//                     message: "Quantity updated successfully",
//                     salePrice,
//                     totalPrice,
//                     quantity,
//                 });
//             } else {
//                 return res.status(400).json({ success: false, message: "Failed to update quantity" });
//             }
//         } else {
//             // Invalid quantity
//             return res.status(400).json({
//                 success: false,
//                 message: "Quantity must be greater than or equal to 0",
//             });
//         }
//     } catch (err) {
//         console.error("Error in changeQuantity:", err);
//         return res.status(500).json({ success: false, message: "Internal server error" });
//     }
// };

const changeQuantity = async (req, res) => {
    const { productId, quantity } = req.body;
    console.log(quantity);

    try {
        // Fetch the product and its category to calculate the sale price
        const product = await Product.findOne({ _id: productId }).populate("category", "categoryOffer");

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const currentCart = await Cart.findOne({ "items.productId": productId });
        if (!currentCart) {
            return res.status(404).json({ success: false, message: "Cart item not found" });
        }

        // Get the current quantity of the product in the cart
        const currentQuantity = currentCart.items.find(item => item.productId.toString() === productId)?.quantity || 0;

        // Calculate the quantity change
        const quantityChange = quantity - currentQuantity;

        // Handle stock availability
        if (quantityChange > 0 && quantityChange > product.quantity) {
            return res.status(200).json({
                success: false,
                message: 'Not enough stock available',
                availableStock: product.quantity, // Optionally include available stock
            });
        }

        // Calculate sale price
        const salePrice = calculateSalePrice(product); // Use the function to calculate sale price
        const totalPrice = salePrice * quantity;


        if (quantity === 0) {
            // Remove item from the cart if quantity is 0
            const removedItem = await Cart.updateOne(
                { "items.productId": productId },
                { $pull: { items: { productId } } } // Pull item from cart
            );

            // Restore stock for removed quantity
            if (removedItem.modifiedCount > 0) {
                product.quantity += currentQuantity;
                await product.save();

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
                        "items.$.price": salePrice, // Update the sale price
                        "items.$.totalPrice": totalPrice,
                    },
                }
            );

            if (updatedItem.modifiedCount > 0) {
                // Update product stock
                product.quantity -= quantityChange; // Decrease stock if incremented
                await product.save();

                return res.json({
                    success: true,
                    message: "Quantity updated successfully",
                    salePrice,
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


// Backend route to check if enough stock is available
const checkStock = async (req, res) => {
    const { productId, quantity } = req.body;

    try {
        const product = await Product.findOne({ _id: productId });

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if there’s enough stock
        if (product.quantity >= quantity) {
            return res.json({ success: true, isStockAvailable: true });
        } else {
            return res.json({ success: true, isStockAvailable: false });
        }
    } catch (error) {
        console.error('Error checking stock availability:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
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

        const item = cart.items.find((item) => item.productId.toString() === productId);
        if (!item) {
            return res.status(404).json({ success: false, message: "Product not found in cart." });
        }
        const deletedQuantity = item.quantity; // Quantity of the product being removed

    
        // Remove the product from the cart's items array
        const updatedCart = await Cart.updateOne(
            { userId, 'items.productId': productObjectId },  // Use ObjectId for comparison
            { $pull: { items: { productId: productObjectId } } }  // Remove item with the specific productId
        );
        console.log("Updated Cart:", updatedCart);


 const refreshedCart = await Cart.findOne({ userId });

        if (refreshedCart.items.length === 0) {
            // If cart is empty, mark it as deleted and reset fields
            refreshedCart.isDeleted = true;
            refreshedCart.items = [];
            refreshedCart.coupon = null; // Clear coupon details
            refreshedCart.grandTotal = 0; // Reset totals
            refreshedCart.discount = 0;

            await refreshedCart.save();
            console.log("Cart marked as deleted and reset.");
        } 
        
         // Add the deleted quantity back to the product stock
         const product = await Product.findById(productObjectId); 
         if (product) {
             product.quantity += deletedQuantity; // Restore stock
             await product.save();
             console.log(`Restored ${deletedQuantity} units to product stock.`);
             console.log(product.quantity)
         } else {
             console.log("Product not found while trying to restore stock.");
         }
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
// const getCheckOut = async(req,res)=>{
    
//         try {
//             const { cartId,totalPrice } = req.body;  // Retrieve cartId from URL
//             console.log(req.body)
//             const userId = req.session.user
//             const cart = await Cart.findById(cartId).populate('items.productId');
//             const userData=await User.findById(userId)
       
//             if (!cart || cart.items.length === 0) {
//                 return res.redirect('/user/cart'); // Redirect to cart if it's empty
//             }
         
//             const user = await User.findById(userId).populate('addresses');
//             const addressDetails = user.addresses.map(address => ({
//                 ...address.toObject(),
//                 address: address.address.map(addr => ({
//                     _id: addr._id,
//                     name: addr.name,
//                     city: addr.city,
//                     state: addr.state,
//                     pincode: addr.pincode,
//                     landMark: addr.landMark,
//                     phone: addr.phone
//                 }))
//             }));
//             const grandTotal = cart.items.reduce((acc, item) => acc + item.totalPrice, 0);
//             const discount = cart.coupon?.discount || 0; // Use `0` if no coupon applied
//         const finalTotal = grandTotal - discount;
     
            
//             res.render('user/checkOut', {
//                 items:cart.items,
//                 quantity:cart.quantity,
//                 addresses: addressDetails,
//                 cartId,
//                 totalPrice,
//                 grandTotal,
//                 finalTotal,
//                 discount,
//                 username:userData.username
//             });
//             console.log("totalpricr:",totalPrice)
            
//         } catch (error) {
//             console.error('Error loading checkout page:', error);
//             res.status(500).send('Error loading checkout page.');
//         }
    
    
// }

// const getCheckOut = async (req, res) => {
//     try {
//         const { cartId, totalPrice } = req.body;  // Retrieve cartId from URL
//         console.log(req.body);
//         const userId = req.session.user;
//         const cart = await Cart.findById(cartId)
//     .populate({
//         path: 'items.productId',
//         populate: { path: 'category', select: 'categoryOffer' },
//     });

//         const userData = await User.findById(userId);
        
//         if (!cart || cart.items.length === 0) {
//             return res.redirect('/user/cart'); 
//         }

//         // Fetch the user's address details
//         const user = await User.findById(userId).populate('addresses');
//         const addressDetails = user.addresses.map(address => ({
//             ...address.toObject(),
//             address: address.address.map(addr => ({
//                 _id: addr._id,
//                 name: addr.name,
//                 city: addr.city,
//                 state: addr.state,
//                 pincode: addr.pincode,
//                 landMark: addr.landMark,
//                 phone: addr.phone
//             }))
//         }));

        
//         let totalSaved = 0;

//         // Calculate the total price and the amount saved from offers
//         const grandTotal = cart.items.reduce((acc, item) => {
//             const product = item.productId;
//             const categoryOffer = product.category?.categoryOffer || 0;  // Access the categoryOffer field from category
//             const productOffer = product.productOffer || 0;
//             console.log("category offer",categoryOffer)
//             // Sum of both offers
//             const totalOffer = categoryOffer + productOffer;
//             const discountAmount = (totalOffer / 100) * product.regularPrice;

            
//             const salePrice = product.regularPrice - discountAmount;
//             item.totalPrice = salePrice * item.quantity; // Total price for the item
//              // Calculate original total (before discount)
//              const originalTotal = product.regularPrice * item.quantity;

//              // Store originalTotal in the item
//              item.originalTotal = originalTotal;
//              item.totalPrice = salePrice * item.quantity; // Total price for the item
 

//             // Accumulate discount for the user
//             totalSaved += discountAmount * item.quantity;

//             return acc + item.totalPrice; // Add item total price to grand total
//         }, 0);

//         // Calculate final total price after applying any coupon (if present)
//         const discount = cart.coupon?.discount || 0;  // Coupon discount (if any)
//         const finalTotal = grandTotal - discount; // Final total after coupon

//         res.render('user/checkOut', {
//             items: cart.items,
//             quantity: cart.quantity,
//             addresses: addressDetails,
//             cartId,
//             totalPrice,
//             grandTotal,
//             finalTotal,
//             discount,
//             totalSaved:parseFloat(totalSaved.toFixed(2)),// Pass the total amount saved from offers
//             username: userData.username
//         });
//         console.log("totalPrice: and grand total", totalPrice,grandTotal);
        
//     } catch (error) {
//         console.error('Error loading checkout page:', error);
//         res.status(500).send('Error loading checkout page.');
//     }
// };

const getCheckOut = async (req, res) => {
    try {
        const { cartId, totalPrice } = req.body; // Retrieve cartId from request body
        const userId = req.session.user;

        const cart = await Cart.findById(cartId).populate({
            path: 'items.productId',
            populate: { path: 'category', select: 'categoryOffer' },
        });

        const userData = await User.findById(userId);

        if (!cart || cart.items.length === 0) {
            return res.redirect('/user/cart'); 
        }

        // Fetch the user's address details
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
        
        const shoppingCharge=50
        // Calculate final total price after applying any coupon (if present)
        const discount = cart.coupon?.discount || 0; // Coupon discount (if any)
        const finalTotal = parseFloat((grandTotal - discount + shoppingCharge).toFixed(2));

        res.render('user/checkOut', {
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
            username: userData.username
        });

        console.log("Total Price:", totalPrice);
        console.log("Grand Total:", grandTotal);
        console.log("Original Total Price:", originalTotalPrice);
        
    } catch (error) {
        console.error('Error loading checkout page:', error);
        res.status(500).send('Error loading checkout page.');
    }
};




// const placeOrders = async (req, res) => {
//     try {
//         const { cartId, paymentMethod, address } = req.body;
//         console.log("req.body while order placing", req.body);
//         console.log('Payment Method:', paymentMethod);
        
//         const userId = req.session.user;
//         const userData = await User.findById(userId)
        
//         // Fetch the cart using the cartId and populate the items with product details
//         const cart = await Cart.findById(cartId).populate('items.productId');

//         if (!cart) {
//             return res.status(404).send('Cart not found');
//         }
//         const addressId =  new mongoose.Types.ObjectId(address);

//         const selectedaddress1 = await Address.findOne(
//             { userId, "address._id": addressId }, // Match userId and address._id
//             { "address.$": 1 } // Project only the matching address element
//         );
//         console.log(selectedaddress1)
//         // Calculate total price
//         const totalPrice = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);

//         // Check stock for each product and update inventory
//         for (const item of cart.items) {
//             const product = await Product.findById(item.productId._id); // Find the product by its ID

//             // If product is not found, throw an error
//             if (!product) {
//                 return res.status(404).send(`Product not found: ${item.productId._id}`);
//             }

            
//              if (product.quantity < item.quantity) {
//               console.log(product.quantity)
//                 console.log("item quantity",item.quantity)

//               return res.status(400).send(`Not enough stock for ${product.productName}`);
//             }

//             // Decrease the product quantity by the ordered quantity
//             product.quantity -= item.quantity;
//             await product.save(); // Save the updated product
//         }
//            // If payment method is Wallet, check if the user has enough balance
//            if (paymentMethod === 'Wallet') {
//             const wallet = await Wallet.findOne({ userId }); // Find the user's wallet

//             if (!wallet) {
//                 return res.status(404).send('Wallet not found');
//             }

//             if (wallet.balance < totalPrice) {
//                 return res.status(400).send('Insufficient wallet balance');
//             }

//             // Deduct the total price from the wallet balance
//             wallet.balance -= totalPrice;
//             await wallet.save(); // Save the updated wallet balance

//             // Log the wallet transaction as a Withdrawal
//             wallet.transactions.unshift({
//                 transactionId: uuidv4(),
//                 description: `Payment for order ${savedOrder._id}`,
//                 type: 'Withdrawal',
//                 amount: totalPrice,
//                 orderId: savedOrder._id,
//                 date: new Date(),
//             });
//             await wallet.save(); // Save the updated transaction log
//         }

//         // Create a new order
//         const newOrder = new Order({
//             orderItems: cart.items.map(item => ({
//                 product: item.productId._id,
//                 quantity: item.quantity,
//                 price: item.price,
//             })),
//             totalPrice: totalPrice,
//             finalAmount: totalPrice, // Adjust if there are discounts or other fees
//             paymentMethod: paymentMethod,
//             selectedAddress:addressId,
//             address: userId,
//             status: 'Pending', // Set initial status as 'Pending'
//             paymentStatus: paymentMethod === 'Cash on Delivery' ?  'Pending':'Awaiting Payment',
//             createdOn: new Date(), // Current date and time
//         });

//         // Save the new order to the database
//         const savedOrder = await newOrder.save();

//         // Optionally mark the cart as deleted or clear its items
//          cart.items=[]
//         await cart.save();
//         if (paymentMethod === "Wallet") {
//             return res.render('user/orderPlaced', {
//                 orderId: savedOrder._id,
//                 totalPrice: savedOrder.totalPrice,
//                 paymentMethod: savedOrder.paymentMethod,
//                 createdOn: savedOrder.createdOn,
//                 ordernumber: savedOrder.orderId,
//                 username: userData.username
//             });
//         }
//         if (paymentMethod !== "Cash on Delivery") {
//             return res.redirect(`/user/getPaymentPage?orderId=${savedOrder._id}&amount=${savedOrder.finalAmount}`);
//           }

//         // Redirect to an order confirmation page or render a success page
//         res.render('user/orderPlaced', {  
//             orderId: savedOrder._id,  // Order ID
//             totalPrice: savedOrder.totalPrice,  // Total price of the order
//             paymentMethod: savedOrder.paymentMethod,  // Payment method
//             createdOn: savedOrder.createdOn,
//             ordernumber: savedOrder.orderId,
//             username:userData.username
//         });
//     } catch (error) {
//         console.error('Error placing order:', error);
//         res.status(500).send('Server error');
//     }
// };

const placeOrders = async (req, res) => {
    try {
        const { cartId, paymentMethod, address ,totalSaved,discount,originalTotalPrice} = req.body;
        console.log("req.body while order placing", req.body);
        console.log('Payment Method:', paymentMethod);
        
        const userId = req.session.user;
        const userData = await User.findById(userId);
        
        // Fetch the cart using the cartId and populate the items with product details
        const cart = await Cart.findById(cartId).populate('items.productId');

        if (!cart) {
            return res.status(404).send('Cart not found');
        }

        const addressId = new mongoose.Types.ObjectId(address);

        const selectedAddress = await Address.findOne(
            { userId, "address._id": addressId }, // Match userId and address._id
            { "address.$": 1 } // Project only the matching address element
        );
        console.log(selectedAddress);
        

        // Calculate total price
        const totalPrice = cart.items.reduce((sum, item) => sum + item.totalPrice, 0);
        const grandTotal = cart.grandTotal;
      console.log("grandtotal and totalPrice in order:::",grandTotal,totalPrice);
      const shippingCharge = 50.00
      totalWithShipping =(parseFloat(totalPrice+shippingCharge).toFixed(2))

        // Check stock for each product and update inventory
        for (const item of cart.items) {
            const product = await Product.findById(item.productId._id);

            // If product is not found, throw an error
            if (!product) {
                return res.status(404).send(`Product not found: ${item.productId._id}`);
            }

            // if (product.quantity < item.quantity) {
            //     console.log(product.quantity);
            //     console.log("item quantity", item.quantity);

            //     return res.status(400).send(`Not enough stock for ${product.productName}`);
            // }

            // Decrease the product quantity by the ordered quantity
            product.quantity -= item.quantity;
            await product.save(); // Save the updated product
        }

        const couponApplied = cart.coupon && cart.coupon.code ? true : false;
        const couponCode = couponApplied ? cart.coupon.code : null;

        const totalDiscounts = parseFloat(totalSaved) + parseFloat(discount);


        // Create a new order
        const newOrder = new Order({
            orderItems: cart.items.map(item => ({
                product: item.productId._id,
                quantity: item.quantity,
                price: item.price,
            })),
            totalPrice: totalPrice, // Use grandTotal from the cart
            finalAmount: totalWithShipping, // Adjust if there are discounts or other fees
            paymentMethod: paymentMethod,
            selectedAddress: addressId,
            address: userId,
            status: 'Pending', // Set initial status as 'Pending'
            paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Awaiting Payment', // Update to 'Paid' later if Wallet
            createdOn: new Date(), // Current date and time
            couponApplied, // Set the couponApplied field
            couponCode, 
            discounts:totalDiscounts,
            originalTotalPrice
        });

        // Save the new order to the database
        const savedOrder = await newOrder.save();

        const populatedOrder = await savedOrder.populate({
            path: 'orderItems.product',
            select: 'productName', // Specify the fields you want to populate
        });


        // If payment method is Wallet, check if the user has enough balance
        if (paymentMethod === 'Wallet') {
            const wallet = await Wallet.findOne({ userId }); // Find the user's wallet

            if (!wallet) {
                return res.status(404).send('Wallet not found');
            }

            if (wallet.balance < totalPrice) {
                return res.status(400).send('Insufficient wallet balance');
            }

            // Deduct the total price from the wallet balance
            wallet.balance -= totalPrice;
            await wallet.save(); // Save the updated wallet balance

            // Log the wallet transaction as a Withdrawal
            populatedOrder.orderItems.forEach((item) => {
                wallet.transactions.unshift({
                    transactionId: uuidv4(),
                    description: `Payment for ${item.product.productName}`, // Access the populated product name
                    type: 'Withdrawal',
                    amount: item.price * item.quantity,
                    orderId: savedOrder._id,
                    date: new Date(),
                });
            });  
            await wallet.save(); // Save the updated transaction log

            // Update the order payment status to "Paid"
            savedOrder.paymentStatus = 'Paid';
            await savedOrder.save();

            cart.items = [];
            cart.coupon = { code: null, discount: 0 }; // Clear coupon data
            cart.grandTotal = 0;
            await cart.save();
        }
        //  // Optionally mark the cart as deleted or clear its items
        //  cart.items = [];
        //  await cart.save();
 

        // If payment method is Wallet, proceed with successful order placement
        if (paymentMethod === "Wallet") {
            return res.render('user/orderPlaced', {
                orderId: savedOrder._id,
                totalPrice: savedOrder.totalPrice,
                paymentMethod: savedOrder.paymentMethod,
                createdOn: savedOrder.createdOn,
                ordernumber: savedOrder.orderId,
                username: userData.username
            });
        }

        // Redirect to payment page if payment method is not Wallet
        if (paymentMethod !== "Cash on Delivery") {

            cart.items = [];
         cart.coupon = { code: null, discount: 0 }; // Clear coupon data
          cart.grandTotal = 0;
          await cart.save();
            return res.redirect(`/user/getPaymentPage?orderId=${savedOrder._id}&amount=${savedOrder.finalAmount}`);

            

        }

        cart.items = [];
        cart.coupon = { code: null, discount: 0 }; // Clear coupon data
        cart.grandTotal = 0;
        await cart.save();

        // Redirect to an order confirmation page or render a success page
        res.render('user/orderPlaced', {
            orderId: savedOrder._id,
            totalPrice: savedOrder.totalPrice,
            paymentMethod: savedOrder.paymentMethod,
            createdOn: savedOrder.createdOn,
            ordernumber: savedOrder.orderId,
            username: userData.username,
            grandTotal:savedOrder.grandTotal,
            
        });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).send('Server error');
    }
};





const razorpayPaymentSuccess = async(req,res)=>{

    
        try {
            
            const { orderId, paymentId, paymentMethod } = req.query;
            console.log(orderId)
            
    
            
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
    razorpayPaymentSuccess,
    checkStock
}