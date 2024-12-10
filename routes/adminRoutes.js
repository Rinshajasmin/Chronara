
const express=require('express')
const router= express.Router()
const adminController=require('../controllers/adminController')
const {adminAuth}=require('../middlewares/auth')

router.get('/login',adminController.loadLogin)
 
router.post('/login',adminController.registerLogin)
router.get('/dashBoard',adminAuth,adminController.loadDashBoard)
router.get('/error',adminController.errorPageAdmin)
router.get('/logout',adminController.logout)
module.exports=router
