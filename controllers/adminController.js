const adminmodel = require('../models/adminmodel')
const loadLogin = async (req, res) => {
    // Fetch users from the database (mock example here)
    //res.send('List of all users');
    res.render('admin/login',{ layout: 'layout', isUser: false})

}; 


const registerLogin= async(req,res)=>{
    try {
        const{email,password}= req.body
        const admin= await adminmodel.findOne({email})
        if(!admin)
            return res.render('admin/login',{message:'Invalid credentials'})
        const isMatch= await bcrypt.compare(password,admin.password)
        if(!isMatch)
            return res.render('admin/login',{message:'incorrect password'})
        req.session.admin=true
        res.redirect('/admin/dashBoard')


    } catch (error) {
      res.send(error)  
    }
}

module.exports={loadLogin,registerLogin} 