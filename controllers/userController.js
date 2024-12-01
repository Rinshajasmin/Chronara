
const adminmodel = require('../models/usermodel')
const User = require('../models/usermodel')
const loadLogin = async (req, res) => {
    res.render('user/login',{ layout: 'layout', isUser: true })

}; 
const loadHome= async(req,res)=>{
    try {
        return res.render("user/home")
        
    } catch (error) {
        console.log("Home page not found")
        res.status(500).send("server error")
    }

}
const loadSignup= async (req,res)=>{
    try {
       return  res.render('user/usersignup')

    } catch (error) {
        console.log("home page not loading",error)
        res.status(500).send("server error")
    }
}
const signup= async(req,res)=>{
    const{username,email,password,phone}=req.body
    try {
        const newUser = new User({username,email,password,phone})//creating a new user instance
        console.log(newUser)
        await newUser.save()// to savethat in db
        return  res.redirect('usersignup')// redirecting to login page
        
    } catch (error) {
        console.error("error in user saving",error)
        res.status(500).send("internal server error")
        
    }
}
module.exports={loadLogin,loadHome,loadSignup,signup} 