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
      formatDate: (date, format) => moment(date).local().format(format),
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
      or: function (v1, v2) {
        return v1 || v2;
      },
      isActive: function(expiryDate) {
        const currentDate = moment(); // Get the current date
        const expiry = moment(expiryDate); // Convert expiry date to moment object
        return currentDate.isBefore(expiry); // Return true if the current date is before expiry date
      },
      ifCond: function (value1, value2, options) {
        return value1 === value2 ? options.fn(this) : options.inverse(this);
      },
      neq: function (a, b) {
        return a !== b; // Return true if not equal
      },
      // New helper to perform logical AND
      and: function () {
        const args = Array.prototype.slice.call(arguments, 0, -1); // Exclude the options object
        return args.every(Boolean); // Return true if all arguments are truthy
      },
      contains: function(value, substring) {
        return value && value.includes(substring); // Check if value contains substring
      },
      ifEquals: function (value1, value2, options) {
        // Ensure both values are defined before comparison
        if (value1 == null || value2 == null) {
          return options.inverse(this); // Render the "else" block if either value is undefined or null
        }
      
        // Compare their string representations
        if (value1.toString() === value2.toString()) {
          return options.fn(this); // Render the "if" block if they are equal
        }
        return options.inverse(this); // Render the "else" block otherwise
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
