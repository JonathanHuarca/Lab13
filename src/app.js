const express = require('express');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const exphbs = require('express-handlebars');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
const Handlebars = require('handlebars');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
var mysql = require('mysql');



// Initializations
const app = express();
require('./database');

// Settings


app.set('port', process.env.PORT || 3000);

app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({
    defaultLayout:'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    handlebars: allowInsecurePrototypeAccess(Handlebars), 
    extname: '.hbs'
}));


  
app.set('view engine', '.hbs');

// Middlewares
app.use(morgan('dev'));

// app.use( fileUpload( {
//     createParentPath: true
//   } ) );

app.use(express.json());
app.use(bodyParser.urlencoded({extended: true}));
const storage = multer.diskStorage({
    destination: path.join(__dirname, 'public/uploads'),
    filename: (req, file, cb) =>{
        cb(null, new Date().getTime() + path.extname(file.originalname));
    }
});
app.use(multer({storage}).single('image'));

//express session
// Routes
app.use('/',require('./routes/index'));
//app.use('/users',require('./routes/users'));

module.exports = app;