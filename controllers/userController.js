
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

// const loadLogin = async (req, res) => {
//     res.render('user/login',{ layout: 'layout', isUser: true })

// }; 
// const loadHome= async(req,res)=>{
//     try {
//         console.log(req.session.user)
//         const user = req.session.user;
//         const categories = await Category.find({isListed:true});

//         let productData = await Product.find(
//             {isBlocked:false,
//              category:{$in:categories.map(category=>category._id)},quantity:{$gt:0}
//         })
        
//         productData.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
//          productData=productData.slice(0,4)
     

//         if(user){
//             const userData = await User.findOne({_id:user._id})
//             const productsWithWishlistStatus = productData.map(product => ({
//               ...product.toObject(),
//               isWishlisted: userData.wishlist.includes(product._id.toString()),
//           }));

//           return res.render('user/home', {
//               username: user.username,
//               user: userData,
//               products: productsWithWishlistStatus,
//           });
//             // console.log("Categories:", categories);
//           // return  res.render('user/home', { username: user.username ,user:userData,products:productData});
//         }else{
//             return res.render("user/home",{products:productData})
//         }
        
//     } catch (error) {
//         console.log("Home page not found",error)
//         res.status(500).send("server error")
//     }

// }

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
// const loadShop = async(req,res)=>{
//     try {
//         console.log(req.session.user)
//         const user = req.session.user;
        
//         const categories = await Category.find({isListed:true});

//         let productData = await Product.find(
//             {isDeleted:false})
//             productData.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
//         // productData=productData.slice(0,12)
//        console.log("products",productData)

//         if(user){
//             const userData = await User.findOne({_id:user._id})
//             //console.log("Categories:", categories);
//             //console.log("Products:", productData);
//            return  res.render('user/shop', { username: user.username ,user:userData,products:productData});
//         }else{
//             return res.render("user/home",{products:productData})
//         }
//        // return  res.render('user/shop');
        
//     } catch (error) {
//         console.error("error in loading shop page",error)
//         res.redirect('/user/shop')
//     }
// }


// const loadShop = async (req, res) => {
//   try {
//       const user = req.session.user;
//       const selectedCategory = req.query.category;
        


//       // Fetch all listed categories for the sidebar/menu
//       const categories = await Category.find({ isListed: true });

//       let productData;

//       if (selectedCategory) {
//           // Fetch products that belong to the selected category
//           const category = await Category.findOne({ name: selectedCategory });

//           if (category) {
//               productData = await Product.find({
//                   category: category._id,
//                   isDeleted: false,
//               }).populate("category");
//           } else {
//               productData = []; // No products if category doesn't exist
//           }
//       } else {
//           // Fetch all products if no category is selected
//           productData = await Product.find({ isDeleted: false }).populate("category");
//       }

//       // Sort products by creation date (newest first)
//       productData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//       // Render the shop page with filtered or all products
//       if (user) {
//           const userData = await User.findOne({ _id: user._id });
//           return res.render('user/shop', {
//               username: user.username,
//               user: userData,
//               products: productData,
//               categories,
//               selectedCategory,
//           });
//       } else {
//           return res.render('user/home', {
//               products: productData,
//               categories,
//               selectedCategory,
//           });
//       }
//   } catch (error) {
//       console.error("Error in loading shop page:", error);
//       res.redirect('/user/shop');
//   }
// };

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
// const loadShop = async(req,res)=>{
//     try {
//        const user = req.session.user;
//        const userData = await User.findOne({_id:user});
//        const categories = await Category.find({isListed:true}) ;
//        const categoryIds = categories.map((category)=>category._id.toString())
//        const page = parseInt(req,query.page) || 1;
//        const limit = 9;
//        const skip = (page-1)* limit;
//        const products = await Product.find({
//         isBlocked:false,
//         category:{$in:categoryIds},
//         quantity:{$gt:0}
//        }).sort({createdOn:-1}).skip(skip).limit(limit);

//        const totalProducts = await Product.countDocuments({
//         isBlocked:false,
//         category:{$in:categoryIds},
//         quantity:{$gt:0}
//        });
//        const totalPages = Math.ceil(totalProducts/limit);
//        //const brands = await Brand.find({isBlocked:false});
//        const categoriesWithIds = categories.map(category =>({_id:category._id,name:category.name}))


//        res.render("user/shop",{
//         user:userData,
//         products:products,
//         category:categoriesWithIds,
//         totalProducts:totalProducts,
//         currentPage:page,
//         totalPages:totalPages
//        })


//     } catch (error) {
//        res.redirect("/admin/error") 
//     }
// }

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

 
// const verifyOtp= async(req,res)=>{  
//     try {
//         const {otp}=req.body
//     //    console.log(otp);
//     console.log('otp:', otp, typeof otp);
// console.log('req.session.userOtp:', req.session.userOtp, typeof req.session.userOtp);

//         if(otp === req.session.userOtp){
//             const user =req.session.userData
//             const passwordHash = await securePassword(user.password)
//             const userSaveData = new User({
//                 username:user.username,
//                 email:user.email,
//                 phone:user.phone,
//                 password:passwordHash
//             })
//             await userSaveData.save()
//             req.session.user=userSaveData._id
//             res.json({
//                 success:true,
//                 redirectUrl:"/user/login"
//             })
//         }else{
//             res.status(400).json({success:false,message:"invalid OTP ,Please try again "})
//         }
//     } catch (error) {
//         console.error("error verifying otp",error)
//         res.status(500).json({success:false,message:"An error occurred"})
//     }
// }

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
const filterProduct= async (req, res) => {
    const filterType = req.params.filter;
    let filter = {};
    const userId=req.session.user;
    const user = await User.findById(userId)
  
    // Define filters based on the filterType
    switch (filterType) {
      case 'under-500':
        filter.regularPrice = { $lt: 500 };
        break;
      case '500-1000':
        filter.regularPrice = { $gte: 500, $lte: 1000 };
        break;
      case '1000-1500':
        filter.regularPrice = { $gte: 1000, $lte: 1500 };
        break;
      case 'above-1500':
        filter.regularPrice = { $gt: 1500 };
        break;
      default:
        filter = {}; // No filter applied, show all products
    }
  
    try {
      // Query the database with the filter using async/await
      const products = await Product.find(filter); // No need for .exec()
  
      // Render the filtered products on the new page
      res.render('user/shop', { products,username:user.username });
    } catch (err) {
      console.error('Error retrieving filtered products:', err);
      return res.status(500).send('Error retrieving filtered products');
    }
  }

  const sortProduct = async(req,res)=>{
    try {
        const userId = req.session.user
        const sortType = req.params.sortType; // Get the selected sorting option
        let sortOption = {}; // Default sorting option (empty)
        const user = await User.findById(userId)
        // Define sorting logic based on the criteria
        switch (sortType) {
          case 'popularity':
            sortOption = { popularity: -1 }; // Sort by popularity descending
            break;
          case 'price-low-high':
            sortOption = { regularPrice: 1 }; // Sort by price ascending
            break;
          case 'price-high-low':
            sortOption = { regularPrice: -1 }; // Sort by price descending
            break;
          case 'new-arrivals':
            sortOption = { createdAt: -1 }; // Sort by newest first
            break;
          case 'a-z':
            sortOption = { productName: 1 }; // Sort alphabetically A → Z
            break;
          case 'z-a':
            sortOption = { productName: -1 }; // Sort alphabetically Z → A
            break;
          default:
            sortOption = {}; // No sorting applied
        }
    
        // Fetch products from the database with sorting
        const products = await Product.find().sort(sortOption);
    
        // Render the 'filter.hbs' page with sorted products
        res.render('user/shop', { products ,username:user.username});
      
    } catch (error) {
        console.log("error while sorting",error)
        res.redirect("/admin/error")
    }

  }
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

  // const filterAndSort= async (req, res) => {
  //   try {
  //     const userId = req.session.user
  //     const user = await User.findById(userId)

  //     const { price, sort } = req.query;
  
  //     // Build the query object
  //     let query = { isDeleted: false }; // Only fetch non-deleted products

      
  
  //     if (price !== 'all' && price) {
  //       if (price === 'under-500') query.regularPrice = { $lt: 500 };
  //       if (price === '500-1000') query.regularPrice = { $gte: 500, $lte: 1000 };
  //       if (price === '1000-1500') query.regularPrice = { $gte: 1000, $lte: 1500 };
  //       if (price === 'above-1500') query.regularPrice = { $gt: 1500 };
  //     }
  
  //     // Sorting
  //     let sortOptions = {};
  //     if (sort) {
  //       if (sort === 'price-low-high') sortOptions.regularPrice = 1;
  //       if (sort === 'price-high-low') sortOptions.regularPrice = -1;
  //       if (sort === 'popularity') sortOptions.popularity = -1;
  //       if (sort === 'new-arrivals') sortOptions.createdAt = -1;
  //       if (sort === 'a-z') sortOptions.productName = 1;
  //       if (sort === 'z-a') sortOptions.productName = -1;
  //     }
  
  //     // Fetch filtered and sorted products
  //     const products = await Product.find(query).sort(sortOptions);
  
  //     res.render('user/shop', {username:user.username,
  //       products,
  //       price,
  //       sort,
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).send('Internal Server Error');
  //   }
  // };

  // const filterAndSort = async (req, res) => {
  //   try {
  //     const userId = req.session.user;
  //     const user = await User.findById(userId);
  //     const categories = await Category.find({ isListed: true });

  
  //     const { price, sort, category } = req.query;
  
  //     // Build the query object
  //     let query = { isDeleted: false }; // Only fetch non-deleted products
  
  //     // Price filter
  //     if (price !== 'all' && price) {
  //       if (price === 'under-500') query.regularPrice = { $lt: 500 };
  //       if (price === '500-1000') query.regularPrice = { $gte: 500, $lte: 1000 };
  //       if (price === '1000-1500') query.regularPrice = { $gte: 1000, $lte: 1500 };
  //       if (price === 'above-1500') query.regularPrice = { $gt: 1500 };
  //     }
  
  //     // Category filter
  //     if (category !== 'all' && category) {
  //       query.category = category; // Match the category field in your Product schema
  //     }
  
  //     // Sorting
  //     let sortOptions = {};
  //     if (sort) {
  //       if (sort === 'price-low-high') sortOptions.regularPrice = 1;
  //       if (sort === 'price-high-low') sortOptions.regularPrice = -1;
  //       if (sort === 'popularity') sortOptions.popularity = -1;
  //       if (sort === 'new-arrivals') sortOptions.createdAt = -1;
  //       if (sort === 'a-z') sortOptions.productName = 1;
  //       if (sort === 'z-a') sortOptions.productName = -1;
  //     }
  
  //     // Fetch filtered and sorted products
  //     const products = await Product.find(query).sort(sortOptions);
  
  //     res.render('user/shop', {
  //       username: user.username,
  //       products,
  //       price,
  //       sort,
  //       categories,
  //       category ,// Pass the selected category back to the frontend
      
  //     });
  //   } catch (err) {
  //     console.error(err);
  //     res.status(500).send('Internal Server Error');
  //   }
  // };

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
  
  
  
  
  
 const getuserProfile = async(req,res)=>{

 } 

 const getFilteredAndSortedProducts = async (req, res) => {
    const { filter, sortType } = req.query; // Get filter and sort parameters from the query string
    let filterCriteria = {};
    let sortOption = {};
  
    // Define filtering criteria
    switch (filter) {
      case 'under-500':
        filterCriteria.regularPrice = { $lt: 500 };
        break;
      case '500-1000':
        filterCriteria.regularPrice = { $gte: 500, $lte: 1000 };
        break;
      case '1000-1500':
        filterCriteria.regularPrice = { $gte: 1000, $lte: 1500 };
        break;
      case 'above-1500':
        filterCriteria.regularPrice = { $gt: 1500 };
        break;
      default:
        filterCriteria = {}; // No filter applied
    }
  
    // Define sorting options
    switch (sortType) {
      case 'popularity':
        sortOption = { popularity: -1 }; // Sort by popularity descending
        break;
      case 'price-low-high':
        sortOption = { regularPrice: 1 }; // Sort by price ascending
        break;
      case 'price-high-low':
        sortOption = { regularPrice: -1 }; // Sort by price descending
        break;
      case 'new-arrivals':
        sortOption = { createdAt: -1 }; // Sort by newest first
        break;
      case 'a-z':
        sortOption = { productName: 1 }; // Sort alphabetically A → Z
        break;
      case 'z-a':
        sortOption = { productName: -1 }; // Sort alphabetically Z → A
        break;
      default:
        sortOption = {}; // No sorting applied
    }
  
    try {
      // Fetch products from the database with both filtering and sorting
      const products = await Product.find(filterCriteria).sort(sortOption);
  
      // Render the page with filtered and sorted products
      res.render('user/shop', {
        products,
        selectedSort: sort || '', // Pass the current sorting option
      });
          } catch (err) {
      console.error('Error while filtering and sorting products:', err);
      res.status(500).send('Error while filtering and sorting products');
    }
  };

  const filterAndSortProducts = async (req, res) => {
    const { filter, sort } = req.query; // Get query parameters for filter and sort
    let filterQuery = {};
    let sortOption = {};
  
    // Define filters based on the filter type
    switch (filter) {
      case 'under-500':
        filterQuery.regularPrice = { $lt: 500 };
        break;
      case '500-1000':
        filterQuery.regularPrice = { $gte: 500, $lte: 1000 };
        break;
      case '1000-1500':
        filterQuery.regularPrice = { $gte: 1000, $lte: 1500 };
        break;
      case 'above-1500':
        filterQuery.regularPrice = { $gt: 1500 };
        break;
      default:
        filterQuery = {}; // No filter applied
    }
  
    // Define sorting options based on the sort type
    switch (sort) {
      case 'popularity':
        sortOption = { popularity: -1 }; // Sort by popularity descending
        break;
      case 'price-low-high':
        sortOption = { regularPrice: 1 }; // Sort by price ascending
        break;
      case 'price-high-low':
        sortOption = { regularPrice: -1 }; // Sort by price descending
        break;
      case 'new-arrivals':
        sortOption = { createdAt: -1 }; // Sort by newest first
        break;
      case 'a-z':
        sortOption = { productName: 1 }; // Sort alphabetically A → Z
        break;
      case 'z-a':
        sortOption = { productName: -1 }; // Sort alphabetically Z → A
        break;
      default:
        sortOption = {}; // No sorting applied
    }
  
    try {
      // Fetch products with both filtering and sorting applied
      const products = await Product.find(filterQuery).sort(sortOption);
  
      // Render the 'filter' page with filtered and sorted products
      res.render('user/filter', { 
        products, 
        selectedFilter: filter, 
        selectedSort: sort 
      });
    } catch (err) {
      console.error('Error retrieving products:', err);
      res.status(500).send('Error retrieving products');
    }
  };

  const getAboutPage = async(req,res)=>{
    try {
      res.render('user/aboutUs')
    } catch (error) {
      
    }
  }
  
  

module.exports={loadLogin,
    loadHome,
    loadSignup,
    signup,verifyOtp,resendOtp,
    pageNotFound,login,logout,loadShop,
    filterProduct,sortProduct,searchProduct,
    getuserProfile,getFilteredAndSortedProducts ,getAboutPage,filterAndSort
} 