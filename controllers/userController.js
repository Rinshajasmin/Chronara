
const adminmodel = require('../models/usermodel')
const loadLogin = async (req, res) => {
    // Fetch users from the database (mock example here)
    //res.send('List of all users');
    res.render('user/login',{ layout: 'layout', isUser: true })

}; 
module.exports={loadLogin} 