// imports //
var mongoose = require('mongoose');
var http = require('http');
var express = require('express');
var exphbs = require('express-handlebars');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);
var helmet = require('helmet');
var passport = require('passport')
    ,	LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');

// create instance of express server //
var app = express();
app.use(helmet());
app.set('port', process.env.PORT || 8080);

// setup handlebars templating //
app.engine('hbs', exphbs( {
    extname: 'hbs',
    defaultView: 'default',
    layoutsDir: __dirname + '/app/server/views/layouts/',
    partialsDir: __dirname + '/app/server/views/partials/',
    helpers: {
        section: function(name, options){
            if(!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
}));
app.set('view engine', 'hbs');


    //TODO use below expression to limit ips that access /postback
// app.use('/postback', function(req, res, next) {
//     // filtering here, calls `res` method to stop progress or calls `next` to proceed
//     let ip = req.ip ||
//         req.headers['x-forwarded-for'] ||
//         req.connection.remoteAddress ||
//         req.socket.remoteAddress ||
//         req.connection.socket.remoteAddress;
//
//     // The IP from the CPA site
//     if (ip === '0.0.0.0') {
//         next();
//     } else {
//         res.end();
//     }
// });

// set up view handling //
app.set('views', __dirname + '/app/server/views');
app.set('view cache', app.get('env') === 'live');
app.use(express.static(__dirname + '/app/public'));

// set up cookie-parser middleware //
app.use(cookieParser('faeb4453e5d14fe6f6d04637f78077c76c73d1b4'));

// set up body-parser middleware //
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// build mongo database connection url //
console.log(app.get('env'));
if (app.get('env') === 'live'){
    // production server settings //
    process.env.DB_HOST = process.env.MONGODB_URI;
    process.env.DB_PORT = process.env.DB_PORT || 63996;
    process.env.DB_NAME = process.env.DB_NAME || 'heroku_f9fjvqkf';
    process.env.DB_URL =  process.env.MONGODB_URI;
} else {

    // development server settings //
    process.env.DB_HOST = process.env.DB_HOST || 'localhost';
    process.env.DB_PORT = process.env.DB_PORT || 27017;
    process.env.DB_NAME = process.env.DB_NAME || 'node-login';
    process.env.DB_URL = 'mongodb://'+process.env.DB_HOST+':'+process.env.DB_PORT+'/'+process.env.DB_NAME;
    app.locals.pretty = true; // output pretty HTML
}

mongoose.connect(process.env.DB_URL,{
    useNewUrlParser: true,
    useFindAndModify: false
}).then(function(o){
    db = o;
}).catch(function(e){
    console.log(e);
});

// setup express-sessions //
app.use(session({
        secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
        resave: true,
        saveUninitialized: false,
        store: new MongoStore({
            url: process.env.DB_URL,
            touchAfter: 3600
        }),
    })
);
require('./app/config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// set up the router //
require('./app/server/routes')(app, passport);

// create server //
http.createServer(app).listen(app.get('port'), function(){
    console.log('Express server listening on port ' + app.get('port'));
});
