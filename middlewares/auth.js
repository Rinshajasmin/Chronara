const { Admin } = require('mongodb');
const User = require('../models/usermodel')
const admin = require('../models/adminmodel')
const userAuth = async(req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                 next();
            }else{
                res.redirect('/user/login')
            }
        })
        .catch(error=>{
            console.log('error in user auth middleware')
            res.status(500).send("internal server error")
        })
    
    }else{
        res.redirect("/user/login")
    }
}

const adminAuth = async(req,res,next)=>{
   if(req.session && req.session.admin)
    admin.findOne({isAdmin:true})
    .then(data=>{
        if(data){
        next()
        }else{
            res.redirect('/admin/login')
        }
    })
    .catch(error=>{
        console.log("error in admin auth middleware",error)
        res.status(500).send("internal server error")

    })
}
module.exports={adminAuth,userAuth}