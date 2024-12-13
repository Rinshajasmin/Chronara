
const adminmodel = require('../models/usermodel')
const User = require('../models/usermodel')
const Category = require('../models/categorySchema')
const Product = require('../models/productSchema')

const env = require('dotenv').config();
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')

const loadLogin = async (req,res)=>{
      try {
         if(!req.session.user){
            return res.render('user/login',{ layout: 'layout', isUser: true });
         }else{
            res.redirect('/user/home')
         }
      } catch (error) {
        res.redirect("/error ")
      }
}
const login = async (req,res)=>{
    try {
        const {username,password } = req.body
        const findUser = await User.findOne({username:username})
        if(!findUser){
            return res.render('user/login',{message:"user not found", layout: 'layout', isUser: true})
        }if(findUser.isBlocked){
            return res.render('user/login',{message:"user is blocked by admin ", layout: 'layout', isUser: true})
        }
        const passwordMatch = await bcrypt.compare(password,findUser.password)
        if(!passwordMatch){
         return res.render('user/login',{message:"wrong password", layout: 'layout', isUser: true})
        }
        req.session.user = {
           _id: findUser._id,
           username:findUser.username

        };
        res.redirect('/user/home')
    } catch (error) {
           console.error("login error",error)
           res.render('user/login',{message:"login failed...please try again", layout: 'layout', isUser: true})
    }
}

// const loadLogin = async (req, res) => {
//     res.render('user/login',{ layout: 'layout', isUser: true })

// }; 
const loadHome= async(req,res)=>{
    try {
        console.log(req.session.user)
        const user = req.session.user;
        const categories = await Category.find({isListed:true});

        let productData = await Product.find(
            {isBlocked:false,
            // category:{$in:categories.map(category=>category._id)},quantity:{$gt:0}
        })
        
        productData.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
        productData=productData.slice(0,4)
     

        if(user){
            const userData = await User.findOne({_id:user._id})
            console.log("Categories:", categories);
            console.log("Products:", productData);
           return  res.render('user/home', { username: user.username ,user:userData,products:productData});
        }else{
            return res.render("user/home",{products:productData})
        }
        
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
// const signup= async(req,res)=>{
//     const{username,email,password,phone}=req.body
//     try {
//         const newUser = new User({username,email,password,phone})//creating a new user instance
//         console.log(newUser)
//         await newUser.save()// to savethat in db
//         return  res.redirect('usersignup')// redirecting to login page
        
//     } catch (error) {
//         console.error("error in user saving",error)
//         res.status(500).send("internal server error")
        
//     }
// }
const securePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash
    } catch (error) {
        
    }

}

 
const verifyOtp= async(req,res)=>{  
    try {
        const {otp}=req.body
    //    console.log(otp);
    console.log('otp:', otp, typeof otp);
console.log('req.session.userOtp:', req.session.userOtp, typeof req.session.userOtp);

        if(otp === req.session.userOtp){
            const user =req.session.userData
            const passwordHash = await securePassword(user.password)
            const userSaveData = new User({
                username:user.username,
                email:user.email,
                phone:user.phone,
                password:passwordHash
            })
            await userSaveData.save()
            req.session.user=userSaveData._id
            res.json({
                success:true,
                redirectUrl:"/user/login"
            })
        }else{
            res.status(400).json({success:false,message:"invalid OTP ,Please try again "})
        }
    } catch (error) {
        console.error("error verifying otp",error)
        res.status(500).json({success:false,message:"An error occurred"})
    }
}

function generateOtp(){
    return Math.floor(100000+Math.random()*900000).toString()//method to create a random 6 digit otp
}

async function sendVerificationEmail(email,otp){
    try {
    const transporter = nodemailer.createTransport({
        service:'gmail',
        port:587,//default port of gmail
        secure:false,
        requireTLS:true,
        auth:{
            user:process.env.NODEMAILER_EMAIL,
            pass:process.env.NODEMAILER_PASSWORD
        }
    })
    const info = await transporter.sendMail({
        from:process.env.NODEMAILER_EMAIL,
        to:email,
        subject:"Verify your account",
        text:`your otp is ${otp}`,
        html:`<b> your otp is ${otp}</b>`
    })
    return info.accepted.length>0
  
        
    } catch (error) {
        console.error("error in email sending",error)
        return false;
    }
}
const signup = async(req,res)=>{
    try {
        const {email,password,confirmpassword,username,phone}=req.body
        if(password !== confirmpassword){
            return res.render("user/usersignup",{message:"passwords do not match"})
        }
        const findUser= await User.findOne({email})
        if(findUser){
           return res.render("user/usersignup",{message:"User already exists"})
        }
        const otp =generateOtp()
        const emailSent = await sendVerificationEmail(email,otp);
        if(!emailSent){
          return  res.json("email-error")
        }
        req.session.userOtp=otp;
        req.session.userData={email,password,username,phone}

        res.render("user/verifyOtp")
        console.log("otp sent",otp);
        
    } catch (error) {
       console.error("signup-error",error) 
       res.redirect("/error")
    }
}
const resendOtp =  async(req,res)=>{
    try{
    const {email} = req.session.userData;
    if(!email){
        res.send(400).json({success:false,message:"Email not found in session"})
    }
    const otp=generateOtp()
    req.session.userOtp=otp
    
    const emailSent = await sendVerificationEmail(email,otp);
    if(emailSent){
        console.log("resend otp:" ,otp)
        res.status(200).json({success:"true",message:"OTP send successfully"})
   }else{
    res.status(500).json({success:"false",message:"Failed to resend ...please try again"})
   }
 }catch(error){
    console.error( "error resending otp",error);
    res.status(500).json({success:"false",message:"Internal server error"})
 }
}
 const pageNotFound = async (req,res)=>{
    try {
        res.render('page 404')
    } catch (error) {
        res.redirect('/pageNotFound')
    }
 }
const logout = async (req,res)=>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("session destruction error",err.message)
                return res.redirect('/user/error')
            }
            return res.redirect('/user/login')
        });
    
    } catch (error) {
        console.log("logout error",error)
        res.redirect('/user/error')
    }
         
} 
 

module.exports={loadLogin,loadHome,loadSignup,signup,verifyOtp,resendOtp,pageNotFound,login,logout} 