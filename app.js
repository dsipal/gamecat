// imports //
let http = require('http');
let express = require('express');
let exphbs = require('express-handlebars');
let session = require('express-session');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let MongoStore = require('connect-mongo')(session);
let helmet = require('helmet');
let passport = require('passport')
    ,	LocalStrategy = require('passport-local').Strategy;
let mongoose = require('mongoose');
let secure = require('ssl-express-www');
const dotenv = require('dotenv');
const compression = require('compression');
dotenv.config();

// create instance of express server //
var app = express();
app.use(helmet());
app.use(compression());
app.set('port', process.env.PORT || 8080);
app.use(secure);

// route files //
const index = require('./app/server/routes/index.js');
const account = require('./app/server/routes/account');
const shop = require('./app/server/routes/shop');
const offers = require('./app/server/routes/offers');
const admin = require('./app/server/routes/admin.js');

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


// // TODO use below expression to limit ips that access /postback and /admin
app.use('/offers/postback', function(req, res, next) {
    // filtering here, calls `res` method to stop progress or calls `next` to proceed
    let ip = req.ip ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    if(ip.substr(0,7) === "::ffff:"){
        ip = ip.substr(7);
    }
    // The IP from the CPA site
    if (ip === '54.204.57.82') {
        next();
    } else {
        res.end();
    }
});

app.use('/offers/pwnpostback', function(req, res, next) {
    // filtering here, calls `res` method to stop progress or calls `next` to proceed
    let ip = req.ip ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
    if(ip.substr(0,7) === "::ffff:"){
        ip = ip.substr(7);
    }
    // The IP from the CPA site
    if (ip === '35.196.95.104' || ip === '35.196.169.46') {
        next();
    } else {
        res.end();
    }
});

app.use('/admin/*', function(req, res, next) {
    // filtering here, calls `res` method to stop progress or calls `next` to proceed
    let ip = req.ip ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    // Our IPs
    if (ip === '0.0.0.0') {
        next();
    } else {
        res.end();
    }
});


// set up view handling //
app.set('views', __dirname + '/app/server/views');
app.set('view cache', process.env.NODE_ENV === 'live');
app.use(express.static(__dirname + '/app/public'));

// set up cookie-parser middleware //
app.use(cookieParser(process.env.COOKIEPARSER_SECRET));

// set up body-parser middleware //
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//connect to mongodb instance
mongoose.connect(process.env.MONGODB_URI,{
    useNewUrlParser: true,
    useFindAndModify: false
}).then(function(o){
    db = o;
}).catch(function(e){
    console.log(e);
});

// setup express-sessions //
app.use(session({
        secret: process.env.COOKIEPARSER_SECRET,
        resave: true,
        saveUninitialized: false,
        store: new MongoStore({
            url: process.env.MONGODB_URI,
            touchAfter: 3600
        }),
    })
);
require('./app/config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// set up the router //
app.use('/', index);
app.use('/account', account);
app.use('/shop', shop);
app.use('/offers', offers);
app.use('/admin', admin);

//internal server errors
app.use(function(err, req, res, next) {
    console.log(err);
    return res.status(500).send({ error: err });
});

//404 errors
app.use(function(req, res, next) {
    return res.status(404).render('404');
});

// create server //
http.createServer(app).listen(process.env.PORT, function(){
    console.log('Express server listening on port ' + process.env.PORT);
});


