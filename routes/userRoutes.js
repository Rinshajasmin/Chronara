const express=require('express')
const router= express.Router()
const passport = require('passport')
const userController=require('../controllers/userController')
const {userAuth} = require('../middlewares/auth')

router.get('/login',userController.loadLogin)
router.post('/login',userController.login)
router.get('/home',userAuth,userController.loadHome)
router.get('/usersignup',userController.loadSignup)
router.post('/usersignup',userController.signup)
router.post('/verifyOtp',userController.verifyOtp)
router.post('/resendOtp',userController.resendOtp)
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/user/usersignup'}),(req,res)=>{
   console.log("authentication success")
    res.redirect('/user/home')
})
router.get('/pageNotFound',userController.pageNotFound)
router.get('/logout',userController.logout)
module.exports=router 