
const express=require('express')
const router= express.Router()
const adminController=require('../controllers/adminController')
const {adminAuth}=require('../middlewares/auth')
const customerController = require('../controllers/customerController')
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController')
const couponController = require('../controllers/couponController')
const salesController = require('../controllers/salesController')
const dashBoardController = require('../controllers/dashBoardController')
const multer = require('multer')
const storage = require('../helpers/multer')
const uploads = multer({storage:storage})


router.get('/login',adminController.loadLogin)
 
router.post('/login',adminController.registerLogin)
router.get('/dashBoard',adminAuth,adminController.loadDashBoard)
router.get('/error',adminController.errorPageAdmin)
router.get('/logout',adminController.logout)
//customer management
router.get('/users',adminAuth,customerController.customerInfo)
router.get('/block/:id',adminAuth,customerController.blockCustomer)
router.get('/UnBlock/:id',adminAuth,customerController.unBlockCustomer)
//category management
router.get('/category',adminAuth,categoryController.categoryInfo);
router.post('/addCategory',adminAuth,categoryController.addCategory)
router.post('/editCategory/:id',adminAuth,categoryController.editCategory)
router.post('/deleteCategory/:id',adminAuth,categoryController.deleteCategory)
//product management
router.get('/addProducts',adminAuth,productController.getAddProductPage)
router.post('/addProducts',adminAuth,uploads.array("productImage",5),productController.addProduct)
router.get('/products',adminAuth,productController.getProducts)
router.post('/editProduct/:id',adminAuth,uploads.array("productImage",6),productController.editProduct)
router.get('/editProduct/:id',adminAuth,productController.geteditProduct)
router.post('/deleteProduct/:id',adminAuth,productController.deleteProduct)
router.get('/addProductsnew',productController.getaddnew)
router.post("/addProductsnew",uploads.array("productImage",3),productController.addnew)

//order Management
router.get('/getAllOrders',adminAuth,orderController.getAllOrders)
router.get('/editOrder/:id',adminAuth,orderController.getEditOrder)
// router.post('/deleteOrder/:id',adminAuth,orderController.deleteOrder)
router.post('/statusUpdate/:id',adminAuth,orderController.updateStatus)

//coupon management
router.get('/coupons',adminAuth,couponController.getAllCoupons)
router.get('/addCoupons',adminAuth,couponController.getAddCoupons)
router.post('/addCoupons',adminAuth,couponController.addCoupons)
router.post('/deleteCoupon/:id',adminAuth,couponController.deleteCoupon)
router.get('/editCoupon/:id',adminAuth,couponController.getEditCoupon)
router.post('/editCoupon/:id',adminAuth,couponController.editCoupon)


//sales-report management
router.post('/getSalesReport', adminAuth, salesController.postSalesReport);
router.get('/getSalesReport', adminAuth, salesController.getSalesPage); // Default weekly view

router.post('/downloadPDF',adminAuth,salesController.generateSalesPDF)
router.post('/downloadExcel',adminAuth,salesController.generateSalesExcel)


//dashboard management
router.get('/getDashBoard',adminAuth,dashBoardController.getDashBoard)
router.post('/getFilteredRevenue',adminAuth,dashBoardController.getFilteredRevenue)



module.exports=router
