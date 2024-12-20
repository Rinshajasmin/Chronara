const User = require('../models/usermodel')
const Product = require('../models/productSchema');
const Address = require('../models/addressmodel')
const nodemailer = require('nodemailer')
const bcrypt = require('bcrypt')
const env = require('dotenv').config()
const session = require('express-session')


function generateOtp(){
    const digits="1234567890"
    let otp=""
    for(let i=0;i<6;i++){
        otp+=digits[Math.floor(Math.random()*10)]
    }
    return otp;
    

}

const sendVerificationEmail = async(email,otp)=>{
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
              user:process.env.NODEMAILER_EMAIL,
              pass:process.env.NODEMAILER_PASSWORD  
            }
        })

        const mailOptions = {
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:`your OTP is ${otp}`,
            html:`<b><h4> Your OTP: ${otp}</h4><br></b>`
        }

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent :",info.messageId)
        return true
    } catch (error) {
        console.error("error sending email",error)
        return false
    }

}

const securePassword = async (password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        
    }
}

const getforgotPassword = async(req,res)=>{

    try {
        res.render('user/forgotPassword')
    } catch (error) {
        console.log(error)
        res.redirect('/user/error')
    }
}

const forgotEmailValid=async(req,res)=>{
    try {
        const {email} = req.body;
        console.log(email)
        const findUser = await User.findOne({email:email})
        console.log(findUser)
        if(findUser){
            const otp = generateOtp();
            console.log(otp)
            const emailSent = await sendVerificationEmail(email,otp)
            if(emailSent){
                req.session.userOtp = otp;
                req.session.email = email;
                res.render('user/forgotPass-otp')
                console.log("otp",otp)
            }else{
                res.json({
                    success:false,
                    message:"failed to send otp"
                })
            }
        }else{
            res.render('user/forgotPassword',{message:"user with this email doesnt exist"})
        }

    } catch (error) {
        res.redirect("/user/error")
    }
}

const verifyForgotPassOtp = async (req,res)=>{
    try {
        const enteredOtp = req.body.otp;
        if(enteredOtp === req.session.userOtp){
            res.json({
                success:true,
                redirectUrl:"/user/reset-password"
            })
        }else{
            res.json({
                success:false,
                message:"Otp not matching"
            })
        }
    } catch (error) {
      res.status(500).json({
        success:false,
        message:"An error occurred"
      })  
    }
}

const getResetPassPage = async(req,res)=>{
    try {
        res.render('user/reset-password')
    } catch (error) {
        res.redirect('/user/error')
    }

}

const resendOtp =async(req,res)=>{
try {
    const otp = generateOtp()
    req.session.userOtp = otp;
    const email = req.session.email;
    console.log("resending otp to email:",email)
    const emailSent = await sendVerificationEmail(email,otp)
    if(emailSent){
        console.log("resend Otp:",otp)
        res.status(200).json({
            success:true,
            message:"resend otp successful"
        })
    }
} catch (error) {
    console.error("error in resending the otp",error),
    res.status(500).json({
        success:false,
        message:"Error in resending the otp"
    })
}
}

const postNewPassword = async (req,res)=>{
    try {
        const{newPass1,newPass2}= req.body
         const email=req.session.email
         if(newPass1 === newPass2){
            const passwordHash = await securePassword(newPass1)
            await User.updateOne(
                {email:email},
                {$set:{password:passwordHash}}
            )
            res.redirect('/user/login')
         }else{
            res.render("user/reset-password",{message:'passwords do not match'})
         }
    } catch (error) {
        res.redirect('user/error')
    }

}

// const getUserProfile = async(req,res)=>{
//     try {
//         const userId = req.session.user;
//         const userData = await User.findById(userId);
//         const addressData  = await Address.findOne({userId:userId})
//         res.render('user/userProfile',{user:userData,userAddress:addressData.address})
//     } catch (error) {
//         console.error("error while retreiving userProfile",error)
//         res.redirect('/user/error')
//     }
// }
const getUserProfile = async (req, res) => {
    try {
        const userId = req.session.user; // Get user ID from session
        const userData = await User.findById(userId); // Fetch user data
        const addressData = await Address.findOne({ userId: userId ,isDeleted:false}); // Fetch the address document

        if (!addressData || !addressData.address || addressData.address.length === 0) {
            return res.render('user/userProfile', { user: userData, userAddress: null }); // No addresses found
        }

        res.render('user/userProfile', { user: userData, userAddress: addressData.address }); // Pass only the array
    } catch (error) {
        console.error("Error while retrieving user profile:", error);
        res.redirect('/user/error');
    }
};

const changeEmail = async(req,res)=>{
    try {
        res.render('user/change-email')
        
    } catch (error) {
       console.log("error while changing the email",error ) 
       res.redirect('/user/error')
    }
}

const changemailValid = async(req,res)=>{
 try {
    const {email} = req.body;
    const userExists = await User.findOne({email});
    if(userExists){
        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
            req.session.userOtp = otp;
            req.session.userData = req.body;
            req.session.email = email;
            res.render("user/change-email-otp");
            console.log("Email sent:",email);
            console.log("Otp:",otp)
        }else{
            res.json("email-error")
        }
    } else{
        res.render("user/change-email",{message:"userr with this email not exist"})
    }

 } catch (error) {
    res.redirect("/user/error")
 }
}

const verifyEmailOtp = async(req,res)=>{
    try {
        const enteredOtp = req.body.otp;
        if(enteredOtp ===req.session.userOtp){
            req.session.userData = req.body.userData;
            res.render('user/new-email',{
                userData:req.session.userData,
            })
        }else{
            res.render("change-email-otp",{
                message:"OTP not matching",
                userData:req.session.userData
            })
        }
    } catch (error) {
        res.redirect("/user/error")
    }

}

const updateEmail = async(req,res)=>{
    try{
    const newEmail = req.body.newEmail;
    const userId = req.session.user;
    await User.findByIdAndUpdate(userId,{email:newEmail})
    res.redirect('/user/userProfile')
    }catch(error){
        res.redirect("/user/error")
    }
}

const changePassword = async(req,res)=>{
    try {
        res.render("user/change-password")
    } catch (error) {
        res.redirect("/user/error")
    }
}
const changePasswordValid= async(req,res)=>{
    try{
  const {email} = req.body;
  const userExists = await User.findOne({email})
  if(userExists){
    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email,otp)
        if(emailSent){
          req.session.userOtp=otp;
          req.session.userData = req.body;
          req.session.email = email;
          res.render("user/change-password-otp");
          console.log("otp is",otp)
        }else{
            res.json({
                success:false,
                message:"error in sending otp"
            })
        }
}else{
        res.render("user/change-password",{
            message:"User with this Email doesn't exist"
        })
}
}catch(error){
  console.log("error in change password validation",error)
  res.redirect("/user/error")
}
}

 const verifyChangePassOtp = async(req,res)=>{
    try {
        const enteredOtp = req.body.otp;
        if(enteredOtp===req.session.userOtp){
            res.json({success:true,redirectUrl:"/user/reset-password"})
        }else{
            res.json({success:false,message:"otp not matching"})
        }
    } catch (error) {
       res.status(500).json({sucess:false,message:"An error occurred..please try again"}) 
    }

 }
const getAddAddress = async(req,res)=>{
    try{
    const user = req.session.user;
    res.render('user/addAddress',{user:user})
    }catch(error){
     res.redirect('/user/error')
    }
}

const postAddAddress = async(req,res)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findOne({_id:userId});
        const {addressType,name,city,landMark,state,pincode,phone,altPhone} = req.body;

        const userAddress = await Address.findOne({userId:userData._id});
        if(!userAddress){
            const newAddress = new Address({
                userId:userData._id,
                address: [{addressType,name,city,landMark,state,pincode,phone,altPhone}]

            })
            await newAddress.save();

        }else{
            userAddress.address.push({addressType,name,city,landMark,state,pincode,phone,altPhone})
            await userAddress.save()
        }
        res.redirect('/user/userProfile')

    } catch (error) {
        console.log("error in adding address..pls try again",error)
        res.redirect('/user/error')
    }

}

const deleteAddress = async(req,res)=>{
    try {
        const { addressId } = req.body; // Extract the address ID from the request body
        const userId = req.session.user; // Get the user ID from the session
        const userData = await User.findById(userId); // Fetch user data

        // Find the address document and update it by removing the specific address
        const updatedAddress = await Address.findOneAndUpdate(
            { userId: userId },
            //{ $pull: { address: { _id: addressId } } },
            {isDeleted:true},
            { new: true }
        );

        if (!updatedAddress) {
            return res.status(404).send({ success: false, message: "Address not found" });
        }
       res.render('user/userProfile',{user:userData})
       // res.send({ success: true, message: "Address deleted successfully", data: updatedAddress });
    } catch (error) {
        console.error("Error deleting address:", error);
        res.status(500).send({ success: false, message: "Internal server error" });
    }
}

const getEditAddress = async(req,res)=>{
    try {
        const addressId = req.query.id;
        const user = req.session.user;
        const currAddress = await Address.findOne({
            'address._id':addressId,
        })

        if(!currAddress){
            return res.redirect("/user/error");
        }
        const addressData = currAddress.address.find((item)=>{
        return item._id.toString()===addressId.toString()
      })
       if(!addressData){
        return res.redirect("/user/error")
       }
     res.render("user/edit-address",{address:addressData,user:user})
    } catch (error) {
        console.log("error while editing the address",error)
        res.redirect("/user/error")
    }
}

const updateAddress = async(req,res)=>{
    try {
        const data = req.body;
        const addressId = req.query.id;
        const user = req.session.user;
        const userData = await User.findById(user); // Fetch user data

        const findAddress = await  Address.findOne({"address._id":addressId})
        if(!findAddress){
           return res.redirect("/user/error")
        }
        await Address.updateOne(
            {"address._id":addressId},
            {$set:{
                "address.$" : {
                    _id:addressId,
                    addressType:data.addressType,
                    name:data.name,
                    city:data.city,
                    landMark:data.landMark,
                    state:data.state,
                    pincode:data.pincode,
                    phone:data.phone,
                    altPhone:data.altPhone
                }
            }}
        )
        res.render("user/userProfile",{user:userData,userAddress:findAddress.address}) //do like this when db contain arrays
    } catch (error) {
       console.log("error in address editing",error) 
       res.redirect("/user/error")
    }
}





module.exports={
    getforgotPassword,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    resendOtp,
    postNewPassword,
    postNewPassword,
    getUserProfile,
    changeEmail,
    changemailValid,
    verifyEmailOtp,
    updateEmail,
    changePassword,
    changePasswordValid,
    verifyChangePassOtp,
    getAddAddress,
    postAddAddress,deleteAddress,
    getEditAddress,updateAddress
}