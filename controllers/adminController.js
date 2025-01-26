const adminmodel = require('../models/adminmodel');
const usermodel = require('../models/usermodel');
const mongoose = require('mongoose')
const bcrypt = require ('bcrypt')
const loadLogin = async (req, res) => {
    if(req.session.admin){
        return res.redirect('/admin/dashBoard')
    }
    res.render('admin/login',{ layout: 'layout', isUser: false})

}; 


const registerLogin= async(req,res)=>{
    try {
        const{email,password}= req.body
        const admin= await adminmodel.findOne({email,isAdmin:true})
        if(!admin)
            return res.render('admin/login',{message:'Invalid credentials'})
        const isMatch= await bcrypt.compare(password,admin.password)
        if(!isMatch)
            return res.render('admin/login',{message:'incorrect password'})
        req.session.admin=true
        res.redirect('/admin/getDashBoard')


    } catch (error) {
      console.log("login error",error) 
      res.redirect("/error") 
    } 
}
 const loadDashBoard = async(req,res)=>{
    if(req.session.admin)
    try {
        res.render('admin/dashBoard',{layout:'layout',isUser:false})

    } catch (error) {
         res.redirect('/error')
        
    }
 }

 const errorPageAdmin = async (req,res)=>{
    res.render('admin/error')
 }
 const logout = async(req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.log("error in destroying session",err)
                return res.redirect('/admin/error')
            }
            res.redirect('/admin/login')
        })
        
    } catch (error) {
        console.log("error in logout",error)
        res.redirect('/admin/error')
    }
 }
 

module.exports={loadLogin,registerLogin,loadDashBoard,errorPageAdmin,logout} 