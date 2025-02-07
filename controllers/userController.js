const adminmodel = require('../models/usermodel')
const mongoose = require('mongoose')
const User = require('../models/usermodel')
const Category = require('../models/categorySchema')
const Product = require('../models/productSchema')
const Wallet = require('../models/walletSchema')
const { v4: uuidv4 } = require('uuid');
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

const loadHome = async (req, res) => {
  try {
      console.log(req.session.user);
      const user = req.session.user; // Check if the user is logged in
      const categories = await Category.find({ isListed: true });

      // Fetch products
      let productData = await Product.find({
          isBlocked: false,
          category: { $in: categories.map(category => category._id) },
          quantity: { $gt: 0 }
      });

      // Sort and limit the products
      productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      productData = productData.slice(0, 4);

      if (user) {
          const userData = await User.findOne({ _id: user._id });

          if (!userData) {
              // If user data is not found, clear session and redirect
              req.session.user = null;
              return res.redirect('/user/login');
          }

          // Add `isWishlisted` property to products
          const productsWithWishlistStatus = productData.map(product => ({
              ...product.toObject(),
              isWishlisted: userData.wishlist.includes(product._id.toString()),
          }));

          return res.render('user/home', {
              username: userData.username,
              user: userData,
              products: productsWithWishlistStatus,
          });
      } else {
          // For guests, render home without user-specific data
          return res.render('user/home', { products: productData });
      }
  } catch (error) {
      console.error("Home page not found", error);
      res.status(500).send("Server error");
  }
};

const loadSignup= async (req,res)=>{
    try {
       return  res.render('user/usersignup')

    } catch (error) {
        console.log("home page not loading",error)
        res.status(500).send("server error")
    }
}

const loadShop = async (req, res) => {
  try {
      const user = req.session.user;
      const selectedCategory = req.query.category;
      const page = parseInt(req.query.page) || 1; // Current page, default is 1
      const limit = parseInt(req.query.limit) || 8; // Number of products per page, default is 8
      const skip = (page - 1) * limit;

      // Fetch all listed categories for the sidebar/menu
      const categories = await Category.find({ isListed: true });

      let productQuery = { isDeleted: false };

      if (selectedCategory) {
          const category = await Category.findOne({ name: selectedCategory });
          if (category) {
              productQuery.category = category._id;
          } else {
              return res.render('user/shop', {
                  products: [],
                  categories,
                  selectedCategory,
                  currentPage: page,
                  totalPages,
              });
          }
      }

      // Fetch products with pagination
      const totalProducts = await Product.countDocuments(productQuery); // Total number of products
      const productData = await Product.find(productQuery)
          .populate("category")
          .sort({ createdAt: -1 }) // Newest first
          .skip(skip)
          .limit(limit);

      const totalPages = Math.ceil(totalProducts / limit);

      // Render the shop page with pagination
      const renderData = {
          products: productData,
          categories,
          selectedCategory,
          currentPage: page,
          totalPages,
      };

      if (user) {
          const userData = await User.findOne({ _id: user._id });
          renderData.username = user.username;
          renderData.user = userData;
      }

      return res.render('user/shop', renderData);
  } catch (error) {
      console.error("Error in loading shop page:", error);
      res.redirect('/user/shop');
  }
};

const securePassword = async(password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash
    } catch (error) {
        
    }

}
const generateReferralCode = (name, userId) => {
  return `${name.slice(0, 4).toUpperCase()}${userId.slice(-4)}`;
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (otp === req.session.userOtp) {
      const user = req.session.userData;
      const passwordHash = await securePassword(user.password);
      const referralCode = generateReferralCode(user.username, new mongoose.Types.ObjectId().toString());

      const userSaveData = new User({
        username: user.username,
        email: user.email,
        phone: user.phone,
        password: passwordHash,
        referredBy: user.referredBy, // Save referrer info
        referralCode: referralCode, // Generate and save referral code
      });

      await userSaveData.save();

      // Handle referral bonus if a referral code was used
      if (user.referredBy) {
        const referrer = await User.findOne({ referralCode: user.referredBy });
        if (referrer) {
          // Reward the referrer with a bonus (Example: 100 units)
          await Wallet.updateOne(
            { userId: referrer._id },
            {
              $inc: { balance: 100 },
              $push: {
                transactions: {
                  description: 'Referral Bonus',
                  type: 'Deposit',
                  amount: 100,
                  date: new Date(),
                },
              },
            }
          );
          
          // Add credit to the new user's wallet as well
          let wallet = await Wallet.findOne({ userId: userSaveData._id });
          if (!wallet) {
            wallet = new Wallet({ userId: userSaveData._id, balance: 0, transactions: [] });
          }
          
          // Credit the new user's wallet with a bonus (Example: 50 units for signing up with a referral code)
          wallet.balance += 50; // Adjust the bonus amount as needed
          wallet.transactions.push({
            transactionId: uuidv4(),
            description: 'Referral Credit',
            date: new Date(),
            type: 'Deposit',
            amount: 50, // The bonus amount
          });

          await wallet.save();
        }
      }

      req.session.user = userSaveData._id;
      res.json({
        success: true,
        redirectUrl: "/user/login",
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid OTP, Please try again' });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ success: false, message: "An error occurred" });
  }
};

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
        const {email,password,confirmpassword,username,phone,referralCode}=req.body
        if(password !== confirmpassword){
            return res.render("user/usersignup",{message:"passwords do not match"})
        }
        const findUser= await User.findOne({email})
        if(findUser){
           return res.render("user/usersignup",{message:"User already exists"})
        }

        let referrer = null;

    // Validate referral code if provided
    if (referralCode) {
      referrer = await User.findOne({ referralCode });
      if (!referrer) {
        return res.render("user/usersignup", { message: "Invalid referral code" });
      }
    }

        const otp =generateOtp()
        const emailSent = await sendVerificationEmail(email,otp);
        if(!emailSent){
          return  res.json("email-error")
        }
        req.session.userOtp=otp;
        req.session.userData={email,password,username,phone,referredBy: referrer ? referrer.referralCode : null, // Save referrer if valid
        }

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
// Express Route for Filtered Products

  const searchProduct = async(req,res)=>{
    const userId=req.session.user;
    const user = await User.find(userId)
    const searchQuery = req.query.query;  // Get the search query from URL
    const categories = await Category.find({ isListed: true });


  // If no search term is provided, return all products
  if (!searchQuery) {
    return res.redirect('/user/shop');  // Redirect to the shop page if search is empty
  }

  try {
    const user = await User.findById(userId)

    // Search the database for products matching the search query (case-insensitive)
    const products = await Product.find({
      productName: { $regex: searchQuery, $options: 'i' }  // 'i' for case-insensitive search
    });

    // Render the results page with the filtered products
    res.render('user/shop', { products,username:user.username,categories });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
  }
 const filterAndSort = async (req, res) => {
    try {
      const userId = req.session.user;
      const user = await User.findById(userId);
      const categories = await Category.find({ isListed: true });
  
      const { price, sort, category, page = 1, limit = 8 } = req.query;
  
      const currentPage = parseInt(page); // Current page number
      const itemsPerPage = parseInt(limit); // Number of products per page
      const skip = (currentPage - 1) * itemsPerPage; // Number of products to skip
  
      // Build the query object
      let query = { isDeleted: false }; // Only fetch non-deleted products
  
      // Price filter
      if (price !== "all" && price) {
        if (price === "under-500") query.regularPrice = { $lt: 500 };
        if (price === "500-1000") query.regularPrice = { $gte: 500, $lte: 1000 };
        if (price === "1000-1500") query.regularPrice = { $gte: 1000, $lte: 1500 };
        if (price === "above-1500") query.regularPrice = { $gt: 1500 };
      }
  
      // Category filter
      if (category !== "all" && category) {
        query.category = category; // Match the category field in your Product schema
      }
  
      // Sorting
      let sortOptions = {};
      if (sort) {
        if (sort === "price-low-high") sortOptions.regularPrice = 1;
        if (sort === "price-high-low") sortOptions.regularPrice = -1;
        if (sort === "popularity") sortOptions.popularity = -1;
        if (sort === "new-arrivals") sortOptions.createdAt = -1;
        if (sort === "a-z") sortOptions.productName = 1;
        if (sort === "z-a") sortOptions.productName = -1;
      }
  
      // Fetch total product count for pagination
      const totalProducts = await Product.countDocuments(query);
  
      // Fetch filtered, sorted, and paginated products
      const products = await Product.find(query)
        .sort(sortOptions)
        .skip(skip) // Skip products for pagination
        .limit(itemsPerPage); // Limit products per page
  
      // Calculate total pages
      const totalPages = Math.ceil(totalProducts / itemsPerPage);
  
      res.render("user/shop", {
        username: user.username,
        products,
        price,
        sort,
        categories,
        category, // Pass the selected category back to the frontend
        currentPage,
        totalPages,
      });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  };
 
   const getAboutPage = async(req,res)=>{
    try {
      res.render('user/aboutUs')
    } catch (error) {
      console.log("error in contact page")
    }
  }
  const getContactPage=async(req,res)=>{
    const userId = req.session.user;
    const user = await User.findById(userId)
    res.render('user/contact',{username:user.username})
  }
  const getPrivacyPolicy =async(req,res)=>{
    try {
      res.render('user/privacyPolicy')
    } catch (error) {
      console.log("error while accessing the privacy page",error)
    }
  }
  const getTerms = async(req,res)=>{
try {
  res.render('user/termsOfUse')
} catch (error) {
  console.log("error while loading terms page",error)
}
  }

module.exports={loadLogin,
    loadHome,
    loadSignup,
    signup,verifyOtp,resendOtp,
    pageNotFound,login,logout,loadShop,
    searchProduct,getAboutPage,filterAndSort,getContactPage,
    getPrivacyPolicy,getTerms
} 