const express = require('express');
const path = require('path');
const app = express();
const bodyParser = require('body-parser');

//const helpers = require('./helpers');

const session = require('express-session')
const exphbs = require('express-handlebars');
const passport = require('./config/passport')
const env=require('dotenv').config();
const db=require('./config/db');
db()
const moment = require('moment')
const nocache=require('nocache')
app.use(nocache()) 





// Middleware for parsing JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(session({
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:true,
  cookie:{
   secure:false,
   httpOnly:true,
   maxAge:72*60*60*1000
  }

}))

app.use(passport.initialize());
app.use(passport.session())


// Set static folder
app.use(express.static(path.join(__dirname, 'public')));


// Set up View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs'); 

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


app.engine(
  'hbs',
  exphbs.engine({
    extname: '.hbs',
    defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/',
    partialsDir: [
      __dirname + '/views/user',    // User-specific partials
      __dirname + '/views/admin',   // Admin-specific partials
    ], 
    helpers: {
      formatDate: (date, format) => moment(date).format(format),
      eq: (a, b) => {
        return a === b; // Return true or false for equality check
      },
      statusClass: (status) => {
        switch (status) {
          case 'Pending': return 'text-warning';
          case 'Shipped': return 'text-primary';
          case 'Delivered': return 'text-success';
          case 'Cancelled': return 'text-danger';
          default: return 'text-secondary';
        }
      },
    },
    runtimeOptions: {
      allowProtoPropertiesByDefault: true
    },
  })
);



  app.set('view engine', 'hbs');

  
  

// Import Routes
const userRoutes = require('./routes/userRoutes');
app.use('/user', userRoutes); // Prefix your routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes); 

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
