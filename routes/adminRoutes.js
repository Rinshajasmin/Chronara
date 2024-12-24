
const express=require('express')
const router= express.Router()
const adminController=require('../controllers/adminController')
const {adminAuth}=require('../middlewares/auth')
const customerController = require('../controllers/customerController')
const categoryController = require('../controllers/categoryController')
const productController = require('../controllers/productController')
const orderController = require('../controllers/orderController')
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
router.post('/editProduct/:id',adminAuth,productController.editProduct)
router.get('/editProduct/:id',adminAuth,productController.geteditProduct)
router.post('/deleteProduct/:id',adminAuth,productController.deleteProduct)
router.get('/addProductsnew',productController.getaddnew)
router.post("/addProductsnew",uploads.array("productImage",3),productController.addnew)

//order Management
router.get('/getAllOrders',adminAuth,orderController.getAllOrders)
router.get('/editOrder/:id',adminAuth,orderController.getEditOrder)
router.post('/deleteOrder/:id',adminAuth,orderController.deleteOrder)



module.exports=router
