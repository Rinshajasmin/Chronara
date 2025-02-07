const { Admin } = require('mongodb');
const User = require('../models/usermodel')
const admin = require('../models/adminmodel')
// const userAuth = async(req,res,next)=>{
//     if(req.session.user){
//         User.findById(req.session.user)
//         .then(data=>{
//             if(data && !data.isBlocked){
//                  next();
//             }else{
//                 res.redirect('/user/login')
//             }
//         })
//         .catch(error=>{
//             console.log('error in user auth middleware')
//             res.status(500).send("internal server error")
//         })
    
//     }else{
//         res.redirect("/user/login")
//     }
// }
const userAuth = async (req, res, next) => {
    try {
      if (req.session.user) {
        // Fetch the user by ID and check if the user is blocked
        const user = await User.findOne({ _id: req.session.user, isBlocked: false });
  
        if (user) {
          // User is found and is not blocked, proceed to next middleware
          return next();
        } else {
          // User is either blocked or doesn't exist
          req.session.destroy(() => {
            res.render('user/login',{message:"You are Blocked by admin",layout:'layout',isUser:true});
          });
        }
      } else {
        // User is not logged in, redirect to login page
        res.redirect("/user/login?message=Please%20log%20in%20to%20continue");
      }
    } catch (error) {
      console.error('Error in userAuth middleware:', error);
      res.status(500).send("Internal server error");
    }
  };
  

// const adminAuth = async(req,res,next)=>{
//    if(req.session && req.session.admin)//checking wether the admin is present in the session to ensure while logout
//     admin.findOne({isAdmin:true})
//     .then(data=>{
//         if(data){
//         next()
//         }else{
//             res.redirect('/admin/login')
//         }
//     })
//     .catch(error=>{
//         console.log("error in admin auth middleware",error)
//         res.status(500).send("internal server error")

//     })
// }

const adminAuth = async (req, res, next) => {
  try {
      // Check if session exists and admin is logged in
      if (req.session && req.session.admin) {
          const adminExists = await admin.findOne({ isAdmin: true });
          
          if (adminExists) {
              // Proceed if admin is valid
              return next();
          } else {
              // Redirect to login if no admin found
              return res.redirect('/admin/login');
          }
      } else {
          // Redirect to login if session or admin is missing
          return res.redirect('/admin/login');
      }
  } catch (error) {
      console.error("Error in admin auth middleware:", error);
      return res.status(500).send("Internal Server Error");
  }
};

module.exports={adminAuth,userAuth}