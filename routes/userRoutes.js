const express=require('express')
const router= express.Router()
const userController=require('../controllers/userController')

router.get('/login',userController.loadLogin)
router.get('/home',userController.loadHome)
router.get('/usersignup',userController.loadSignup)
router.post('/usersignup',userController.signup)
module.exports=router