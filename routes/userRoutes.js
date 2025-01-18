const express=require('express')
const router= express.Router()
const passport = require('passport')
const userController=require('../controllers/userController')
const profileController = require('../controllers/profileController')
const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const paymentController = require('../controllers/paymentController')
const couponController = require('../controllers/couponController')
const wishlistController = require('../controllers/wishlistController')
const walletController = require('../controllers/walletController')
const {userAuth} = require('../middlewares/auth')

router.get('/login',userController.loadLogin)
router.post('/login',userController.login)
router.get('/home',userController.loadHome)
router.get('/shop',userController.loadShop)
router.get('/filter/:filter',userController.filterProduct)
router.get('/sort/:sortType',userController.sortProduct)
router.get('/search',userAuth,userController.searchProduct)
router.get('/filter',userAuth,userController.filterAndSort)
// router.get('/filter/:filter/:sortType', userController.getFilteredAndSortedProducts);
router.get('/getAboutPage',userController.getAboutPage)



router.get('/usersignup',userController.loadSignup)
router.post('/usersignup',userController.signup)
router.post('/verifyOtp',userController.verifyOtp)
router.post('/resendOtp',userController.resendOtp)
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/user/usersignup'}),(req,res)=>{
   console.log("authentication success")
    res.redirect('/user/home')
})
//profile Management

router.get('/forgotPassword',profileController.getforgotPassword)
router.post('/forgotEmailValid',profileController.forgotEmailValid)
router.post('/verify-passForget-otp',profileController.verifyForgotPassOtp)
router.get('/reset-password',profileController.getResetPassPage)
router.post('/resend-forgot-otp',profileController.resendOtp)//forgot password
router.post('/reset-password',userAuth,profileController.postNewPassword)
router.get('/userProfile',userAuth,profileController.getUserProfile)
router.get('/change-email',userAuth,profileController.changeEmail)
router.post('/change-email',userAuth,profileController.changemailValid)
router.post('/verify-email-otp',userAuth,profileController.verifyEmailOtp)
router.post('/update-email',userAuth,profileController.updateEmail)
router.get('/change-password',userAuth,profileController.changePassword)
router.post('/change-password',userAuth,profileController.changePasswordValid)
router.post('/verify-changepassword-otp',userAuth,profileController.verifyChangePassOtp)
router.post('/resend-changepassword-otp',userAuth,profileController.resendOtp)//for password change
router.post('/resend-otp',userAuth,profileController.resendOtp)//resend for email change
router.post('/updateAccountDetails',userAuth,profileController.updateAccountDetails)
//address management

router.get('/addAddress',userAuth,profileController.getAddAddress)
router.post('/addAddress',userAuth,profileController.postAddAddress)
router.post('/deleteAddress',userAuth,profileController.deleteAddress)
router.get('/editAddress',userAuth,profileController.getEditAddress)
router.post('/editAddress',userAuth,profileController.updateAddress)
router.get('/getAllAddresses',userAuth,profileController.getAllAddresses)


//product management
router.get('/productDetails',userAuth,productController.getProductDetails)
//cart management
// router.get('/addToCart',userAuth,productController.viewCart)
//  router.post('/addToCart',userAuth,productController.addToCart)
router.get("/cart", userAuth, cartController.getCartPage)
router.post("/addToCart",userAuth, cartController.addToCart)
router.post("/changeQuantity", userAuth,cartController.changeQuantity)
router.post("/checkStock",userAuth,cartController.checkStock)
router.post("/deleteItem", userAuth, cartController.deleteProduct)


//checkout
router.post('/checkOut',userAuth,cartController.getCheckOut)

//order management

router.post('/placeOrder',userAuth,cartController.placeOrders)
router.get('/placeOrder',userAuth,cartController.razorpayPaymentSuccess)
router.get('/getUserOrders',userAuth,orderController.getOrderslist)
router.get('/cancelOrder/:id',userAuth,orderController.getCancelOrder)
router.post('/cancelOrder/:id',userAuth,orderController.orderCancel)
router.post('/returnOrder/:id',userAuth,orderController.returnOrder)
//payment razorpay management
router.post('/makePayment',userAuth,paymentController.createOrder)
router.get('/getPaymentPage',userAuth,paymentController.getPaymentPage)
router.get('/get-razorpay-key',userAuth,paymentController.getKey) 
  

//coupon Management
router.get('/viewAllCoupons',userAuth,couponController.viewAllCoupons)
router.post('/applyCoupon',userAuth,couponController.applyCoupon)
router.post('/removeCoupon',userAuth,couponController.removeCoupon)

//wishlist Management
router.post('/toggleWishlist',userAuth,wishlistController.toggleWishlist);
router.get('/wishlist',userAuth,wishlistController.viewWishlist)
router.post('/removeFromWishlist',userAuth,wishlistController.removeFromWishlist)

//wallet management
router.get('/wallet',userAuth,walletController.getWallet)
router.post('/addMoney',userAuth,walletController.addMoney)

//Referrals
router.get('/referrals',userAuth,walletController.getReferrals)

router.get('/pageNotFound',userController.pageNotFound)
router.get('/logout',userController.logout)
module.exports=router 