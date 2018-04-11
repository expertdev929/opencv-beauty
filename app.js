var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');
var expressValidator = require('express-validator');
var fileUpload = require('express-fileupload');

// Init app
const app = express();

// Set global variables
app.locals.srcImageName = '';
app.locals.srcImageUrl = '';
app.locals.dstImageUrl = '';
app.locals.blur = 13;
//app.locals.balace = 'Normal';

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Set public folder
app.use('/public', express.static(__dirname + '/public'));

// Set global errors variable
app.locals.errors = null;

// Body parser middleware
// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// Fileupload middleware
app.use(fileUpload());

// Express session middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true,
    // cookie: { secure: true }
}));

// Express Validator middleware
app.use(expressValidator({
    errorFormatter: function (param, msg, value) {
        var namespace = param.split('.')
        , root = namespace.shift()
        , formParam = root;

        while (namespace.length) {
            formParam += '[' + namespace.shift() + ']';
        }

        return {
            param: formParam,
            msg: msg,
            value: value
        }
    }
}));

// Express Messages middleware
app.use(require('connect-flash')());
app.use(function (req, res, next) {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Set routes
var index = require('./routes/index');
app.use('/', index);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, function () {
    console.log('Server started on port ' + PORT);
});
