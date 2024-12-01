
const adminmodel = require('../models/usermodel')
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
module.exports={loadLogin,loadHome} 