
const User = require('../models/usermodel')
const Product = require("../models/productSchema");
const Order = require('../models/orderSchema')
const Address = require('../models/addressmodel')
const Cart = require('../models/cartSchema')
const mongodb = require("mongodb");
const mongoose = require('mongoose')
const Coupons = require('../models/couponSchema')



const getAllCoupons = async(req,res)=>{
    try {
        const coupons = await Coupons.find({isList:true}).sort({ createdOn: -1 })
        res.render('admin/couponManagement',{coupons})
    } catch (error) {
       console.log("error while loading all coupons",error)
       res.redirect('/admin/error') 
    }
}

const getAddCoupons = async(req,res)=>{
    try {
        res.render('admin/addCoupon') 
    } catch (error) {
        console.log("error while loading add Coupon page",error)
        res.redirect('/admin/redirect')
    }
}

const addCoupons = async(req,res)=>{
    try {
        const{start,end,name,offerPrice,minimumPrice}=req.body
        console.log("req.body while coupon creation",req.body)

        const newCoupon = new Coupons({
            name:name,
            createdOn:start,
           expireOn:end,
           offerPrice:offerPrice,
           minimumPrice:minimumPrice 
            })

        await newCoupon.save();

        res.render('admin/addCoupon',{successMessage:"New Coupon has been created Successfully"})
    } catch (error) {
        console.log("error in adding coupons",error)
        res.redirect('/admin/error')
    }
}

const deleteCoupon = async(req,res)=>{
    try {
        const {id} = req.params;
        const coupon = await Coupons.findByIdAndUpdate(id,
            {isList:false},
            {new:true} 
        )
        if(!coupon){
            res.status(400).send("Coupon not find")
        }
        res.render('admin/couponManagement',{coupon})
    } catch (error) {
       console.log("error while deleting the coupon",error) 
       res.redirect('/admin/error')
    }
}

const getEditCoupon = async(req,res)=>{
    try {
        const {id} = req.params
        const coupon = await Coupons.findById(id)
        if(!coupon){
            res.status(400).send("coupon not found")
        }
        res.render('admin/editCoupon',{coupon})

    } catch (error) {
        console.log("error while rendering edit page",error)
        res.redirect('/admin/error')
    }
}

const editCoupon = async(req,res)=>{
    const {id}= req.params
    const {start,end,minimumPrice,offerPrice,name} = req.body
    try{
    const updatedData = {
        name: name, // Map 'name' to 'couponCode'
        offerPrice: offerPrice, // Map 'offerPrice' to 'discountAmount'
        minimumPrice: minimumPrice, // Map 'minimumPrice' to 'minPurchase'
        createdOn: new Date(start), // Map 'start' to 'validFrom'
        expireOn: new Date(end), // Map 'end' to 'validUntil'
    };

    // Update the coupon in the database
    await Coupons.findByIdAndUpdate(id, updatedData);

    res.redirect('/admin/coupons'); // Redirect to the coupon management page
} catch (error) {
    console.log("Error while updating coupon", error);
    res.redirect('/admin/error');
}
}

// const viewAllCoupons = async(req,res)=>{
//     try {
//         const coupons = await Coupons.find({ isList: true }).sort({ createdOn: -1 });
//         // const activeCoupons = coupons.filter(coupon => isActive(coupon.expireOn));
//         console.log("Active coupons",activeCoupons)
//         res.render('user/cart', { coupons })
//         // res.json({ success: true, data:  activeCoupons  });
//     } catch (error) {
//         console.error("Error while fetching coupons:", error);
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// }

const viewAllCoupons = async (req, res) => {
    try {
        const currentDate = new Date();
        const activeCoupons = await Coupons.find({
            isList: true,
            expireOn: { $gt: currentDate } // Only fetch coupons with future expiration dates
        }).sort({ createdOn: -1 });

        res.json({ success: true, data: activeCoupons });
    } catch (error) {
        console.error("Error while fetching coupons:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

const calculateSalePrice = (product) => {
    const categoryOffer = product.category?.categoryOffer || 0;
    const productOffer = product.productOffer || 0;
    const totalOffer = categoryOffer + productOffer;

    // Calculate the sale price after applying the offers
    const discountAmount = (totalOffer / 100) * product.regularPrice;
    return product.regularPrice - discountAmount;
};
// const applyCoupon = async (req, res) => {
//     try {
//         const { couponCode } = req.body;
//         const userId = req.session.user;

//         if (!userId) {
//             return res.status(401).json({ success: false, message: "User not logged in." });
//         }

//         // Validate coupon
//         const coupon = await Coupons.findOne({ name: couponCode, isList: true });
//         if (!coupon) {
//             return res.status(400).json({ success: false, message: "Invalid coupon code!" });
//         }

//         // Fetch user's cart
//         const cart = await Cart.findOne({ userId }).populate('items.productId');
//         if (!cart || cart.items.length === 0) {
//             return res.status(400).json({ success: false, message: "Cart is empty!" });
//         }

//         // Calculate cart total
//         const grandTotal = cart.items.reduce(
//             (total, item) => total + item.quantity * ( item.productId.regularPrice),
//             0
//         );

//         // Check coupon eligibility
//         if (grandTotal < coupon.minimumPrice) {
//             return res.status(400).json({
//                 success: false,
//                 message: `Coupon not applicable. Minimum cart value: ₹${coupon.minimumPrice}`,
//             });
//         }

//         // Apply discount
//         const discount = coupon.offerPrice;
//         const discountedTotal = grandTotal - discount;

//         const finalTotal = coupon ? discountedTotal : grandTotal;

//         console.log("Coupon Details:", coupon);
// console.log("Grand Total before Discount:", grandTotal);
// console.log("Discount Amount:", coupon.offerPrice);
// console.log("Grand Total after Discount:", discountedTotal);

//   // Update cart with coupon details
//   cart.coupon = {
//     code: couponCode,
//     discount,
// };
// cart.grandTotal = finalTotal; // Store the final total in the database
// await cart.save();

// // Send response with updated cart details
// res.json({
//     success: true,
//     message: `Coupon applied! You saved ₹${discount}.`,
//     cartDetails: {
//         items: cart.items.map(item => ({
//             productId: item.productId._id,
//             productName: item.productId.productName,
//             quantity: item.quantity,
//             totalPrice: item.quantity * (item.productId.regularPrice),
//         })),
//         grandTotal: finalTotal,
//         discount,
//     },
// });
//     } catch (error) {
//         console.error("Error applying coupon:", error);
//         res.status(500).json({ success: false, message: "Server error." });
//     }
// };



const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not logged in." });
        }

        const coupon = await Coupons.findOne({ name: couponCode, isList: true });
                 if (!coupon) {
                     return res.status(400).json({ success: false, message: "Invalid coupon code!" });
                 }

        const cart = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            populate: {
                path: 'category', // Populate category to get categoryOffer
                select: 'categoryOffer',
            },
        });

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty!" });
        }

        // Calculate grand total using sale price
        const grandTotal = cart.items.reduce((total, item) => {
            const salePrice = calculateSalePrice(item.productId); // Use reusable function
            return total + item.quantity * salePrice;
        }, 0);

        console.log("Grand Total:", grandTotal);
        // ... Rest of the code
        if (grandTotal < coupon.minimumPrice) {
                        return res.status(400).json({
                            success: false,
                            message: `Coupon not applicable. Minimum cart value: ₹${coupon.minimumPrice}`,
                        });
                    }
            
                    // Apply discount
                    const discount = coupon.offerPrice;
                    const discountedTotal = grandTotal - discount;
            
                    const finalTotal = coupon ? discountedTotal : grandTotal;
            
                    console.log("Coupon Details:", coupon);
            console.log("Grand Total before Discount:", grandTotal);
            console.log("Discount Amount:", coupon.offerPrice);
            console.log("Grand Total after Discount:", discountedTotal);
            
              // Update cart with coupon details
              cart.coupon = {
                code: couponCode,
                discount,
            };
            cart.grandTotal = finalTotal; // Store the final total in the database
            await cart.save();
            
            // Send response with updated cart details
            res.json({
                success: true,
                message: `Coupon applied! You saved ₹${discount}.`,
                cartDetails: {
                    items: cart.items.map(item => {
                        const salePrice = calculateSalePrice(item.productId);
                        return {
                            productId: item.productId._id,
                            productName: item.productId.productName,
                            quantity: item.quantity,
                            salePrice,
                            totalPrice: item.quantity * salePrice, // Total based on sale price
                        };
                    }),
                    grandTotal: finalTotal,
                    discount,
                },
            });
                } catch (error) {
                    console.error("Error applying coupon:", error);
                    res.status(500).json({ success: false, message: "Server error." });
                }
            };
            

// const removeCoupon = async (req, res) => {
//     try {
//         const { cartId } = req.body;
//         console.log("remove coupon",req.body);
        
//         const userId = req.session.user;

//         if (!userId) {
//             return res.status(401).json({ success: false, message: "User not logged in." });
//         }

//         // Fetch user's cart
//         const cart = await Cart.findOne({ userId }).populate('items.productId');
//         if (!cart || cart.items.length === 0) {
//             return res.status(400).json({ success: false, message: "Cart is empty!" });
//         }

//         // Calculate cart total
//         const grandTotal = cart.items.reduce(
//             (total, item) => total + item.quantity * ( item.productId.regularPrice),
//             0
//         );

//         // Remove coupon details from cart
//         cart.coupon = null;
//         cart.grandTotal=grandTotal // Clear coupon details

//         await cart.save();
//   console.log("grand total after removing the coupon",grandTotal);
  
//         res.json({
//             success: true,
//             message: "Coupon removed successfully.",
//             cartDetails: {
//                 items: cart.items,
//                 grandTotal: cart.items.reduce(
//                     (total, item) => total + item.quantity * item.productId.regularPrice,
//                     0
//                 ), // Recalculate total without discount
//             },
//         });
//     } catch (error) {
//         console.error("Error removing coupon:", error);
//         res.status(500).json({ success: false, message: "Server error." });
//     }
// };
const removeCoupon = async (req, res) => {
    try {
        const { cartId } = req.body;
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not logged in." });
        }

        // Fetch user's cart
        const cart = await Cart.findOne({ userId }).populate({
            path: 'items.productId',
            populate: {
                path: 'category', // Populate category to get categoryOffer
                select: 'categoryOffer'
            }
        });
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty!" });
        }

        // Function to calculate sale price (same as in applyCoupon)
        const calculateSalePrice = (product) => {
            const categoryOffer = product.category?.categoryOffer || 0;
            const productOffer = product.productOffer || 0;
            const totalOffer = categoryOffer + productOffer;

            // Calculate sale price based on offers
            const discountAmount = (totalOffer / 100) * product.regularPrice;
            return product.regularPrice - discountAmount;
        };

        // Calculate cart total using salePrice
        const grandTotal = cart.items.reduce((total, item) => {
            const salePrice = calculateSalePrice(item.productId); // Use salePrice for each item
            return total + item.quantity * salePrice;
        }, 0);

        // Remove coupon details from cart
        cart.coupon = { code: null, discount: 0 }; // Clear coupon details
        cart.grandTotal = grandTotal; // Update grandTotal with recalculated value

        await cart.save();
        console.log("Grand Total after removing the coupon:", grandTotal);

        // Send response with updated cart details
        res.json({
            success: true,
            message: "Coupon removed successfully.",
            cartDetails: {
                items: cart.items.map(item => {
                    const salePrice = calculateSalePrice(item.productId); // Calculate salePrice for each item
                    return {
                        productId: item.productId._id,
                        productName: item.productId.productName,
                        quantity: item.quantity,
                        salePrice,
                        totalPrice: item.quantity * salePrice, // Total based on sale price
                    };
                }),
                grandTotal,
            },
        });
    } catch (error) {
        console.error("Error removing coupon:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};









module.exports={getAllCoupons,
    getAddCoupons,addCoupons,
    deleteCoupon,getEditCoupon,
    editCoupon,viewAllCoupons,
    applyCoupon,removeCoupon}