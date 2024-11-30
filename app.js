const express = require('express');
const path = require('path');
const app = express();
const exphbs = require('express-handlebars');
const env=require('dotenv').config();
const db=require('./config/db');
db()


// Middleware for parsing JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));


// Set up View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs'); 



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
  })
);

  app.set('view engine', 'hbs');
  

// Import Routes
const userRoutes = require('./routes/userRoutes');
app.use('/users', userRoutes); // Prefix your routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/admin', adminRoutes); 

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
