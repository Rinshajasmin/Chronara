
const express=require('express')
const router= express.Router()
const adminController=require('../controllers/adminController')

router.get('/login',adminController.loadLogin)
 
router.post('/login',adminController.registerLogin)
module.exports=router
