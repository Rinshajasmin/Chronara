
const User = require('../models/usermodel')
const Product = require("../models/productSchema");
const Order = require('../models/orderSchema')
const Address = require('../models/addressmodel')
const Cart = require('../models/cartSchema')
const mongodb = require("mongodb");
const mongoose = require('mongoose')
const Coupons = require('../models/couponSchema')
const moment = require('moment')



const getAllCoupons = async(req,res)=>{
    try {
        const coupons = await Coupons.find({isList:true}).sort({ createdOn: -1 })

        const updatedCoupons = await Promise.all(
            coupons.map(async (coupon) => {
                const currentDateTime = moment(); // Current date and time
                const startDate = moment(coupon.createdOn).startOf('day');
                const expiryTime = moment(coupon.expireOn).endOf('day');

                let status;

                // Determine the status based on current date
                if (currentDateTime.isBefore(startDate)) {
                    status = 'inactive'; // Not yet active
                } else if (currentDateTime.isAfter(expiryTime)) {
                    status = 'expired'; // Past expiration
                } else {
                    status = 'active'; // Within active period
                }

                // Update the status in the database if it has changed
                if (coupon.status !== status) {
                    await Coupons.updateOne({ _id: coupon._id }, { $set: { status } });
                }

                return {
                    ...coupon._doc,
                    status, // Use dynamically updated status
                };
            })
        );

        res.render('admin/couponManagement',{coupons:updatedCoupons})
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

        const existingCoupon = await Coupons.findOne({ name, isList:true});

        if (existingCoupon) {
          return res.render('admin/addCoupon',{ message: 'Coupon name already exists!' });
        }

        const currentDateTime = moment();
        let expiryTime = moment(end);
        
        if (moment(start).isSame(moment(end), 'day')) {
            expiryTime.set({ hour: 23, minute: 59, second: 59, millisecond: 999 });
        }
        const startDate = moment(start); // Parse start as a moment object
        const endDate = moment(end); // Parse end as a moment object



// Use Moment.js to parse the 'end' (expireOn) date
// const status = currentDateTime.isBefore(expiryTime) ? 'active' : 'expired';

let status = 'active'; // Default to active

// If start date is in the future, set status to inactive
if (startDate.isAfter(currentDateTime)) {
    status = 'inactive';
} else if (currentDateTime.isAfter(endDate)) {
    // If current time is after the end date, set status to expired
    status = 'expired';
}
    
        const newCoupon = new Coupons({
            name:name,
            createdOn:start,
           expireOn:end,
           offerPrice:offerPrice,
           minimumPrice:minimumPrice ,
           status:status
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
        const coupons = await Coupons.find({ isList: true });


        res.render('admin/couponManagement',{coupons})
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

const editCoupon = async (req, res) => {
    const { id } = req.params;
    const { start, end, minimumPrice, offerPrice, name } = req.body;
    try {
        const existingCoupon = await Coupons.findOne({ name, _id: { $ne: id } });
        const coupon = await Coupons.findById(id);

        if (existingCoupon) {
            return res.render('admin/editCoupon', {
                message: 'Coupon name already exists!',
                coupon,
            });
        }

        const today = new Date();
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (startDate < today.setHours(0, 0, 0, 0)) {
            return res.render('admin/editCoupon', {
                message1: 'Start date must be today or a future date!',
                coupon,
            });
        }

        if (endDate < startDate) {
            return res.render('admin/editCoupon', {
                message2: 'End date must be after the start date!',
                coupon,
            });
        }

        // Determine the coupon's status
        let status;
        const currentDateTime = new Date();

        if (currentDateTime < startDate) {
            status = 'inactive'; // Coupon is scheduled for the future
        } else if (currentDateTime >= startDate && currentDateTime <= endDate) {
            status = 'active'; // Coupon is valid now
        } else {
            status = 'expired'; // Coupon has expired
        }

        const updatedData = {
            name, // Map 'name' to 'couponCode'
            offerPrice, // Map 'offerPrice' to 'discountAmount'
            minimumPrice, // Map 'minimumPrice' to 'minPurchase'
            createdOn: new Date(start), // Map 'start' to 'validFrom'
            expireOn: new Date(end), // Map 'end' to 'validUntil'
            status, // Updated status
        };

        // Update the coupon in the database
        await Coupons.findByIdAndUpdate(id, updatedData, { new: true });

        // Reload all coupons for the admin view
        const coupons = await Coupons.find({ isList: true }).sort({ createdOn: -1 });

        const updatedCoupons = coupons.map((coupon) => {
            const currentDateTime = moment();
            const expiryTime = moment(coupon.expireOn).endOf('day');
            const calculatedStatus = currentDateTime.isBefore(expiryTime)
                ? (currentDateTime.isBefore(moment(coupon.createdOn)) ? 'inactive' : 'active')
                : 'expired';

            return {
                ...coupon._doc,
                status: calculatedStatus,
            };
        });

        res.render('admin/couponManagement', { coupons: updatedCoupons });
    } catch (error) {
        console.log('Error while updating coupon', error);
        res.redirect('/admin/error');
    }
};

const viewAllCoupons = async (req, res) => {
    try {
        const currentDate = new Date();
        const activeCoupons = await Coupons.find({
            isList: true,
            status:'active',
            // expireOn: { $gte: currentDate } // Only fetch coupons with future expiration dates
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

const applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.user;
        console.log("coupon code is",couponCode)

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not logged in." });
        }
         
        const coupon = await Coupons.findOne ({ name: couponCode, isList: true });
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
                    discount: coupon ? discount : null, // Include discount only if a coupon is applied
                    
                },
            });
                } catch (error) {
                    console.error("Error applying coupon:", error);
                    res.status(500).json({ success: false, message: "Server error." });
                }
            };
            

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
                discount:null
            },
        });
    } catch (error) {
        console.error("Error removing coupon:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};

module.exports = {
  getAllCoupons,
  getAddCoupons,
  addCoupons,
  deleteCoupon,
  getEditCoupon,
  editCoupon,
  viewAllCoupons,
  applyCoupon,
  removeCoupon,
};