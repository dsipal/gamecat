// imports //
let http = require('http');
let express = require('express');
let exphbs = require('express-handlebars');
let session = require('express-session');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let MongoStore = require('connect-mongo')(session);
let helmet = require('helmet');
let passport = require('passport');
let mongoose = require('mongoose');
let sm = require('sitemap');
require('dotenv').config();
let scheduler = require('./app/server/modules/scheduler');

// create instance of express server //
var app = express();
app.use(helmet());
app.set('port', process.env.PORT || 8080);

// route files //
const index = require('./app/server/routes/index');
const login = require('./app/server/routes/login');
const account = require('./app/server/routes/account');
const shop = require('./app/server/routes/shop');
const offers = require('./app/server/routes/offers');
const admin = require('./app/server/routes/admin');

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

if(process.env.NODE_ENV !== 'local'){
    app.use('/offers/postback', function(req, res, next) {
        let ip = req.headers['cf-connecting-ip'];
        let authorized_ips = process.env.POSTBACK_IPS.split(', ');
        if (authorized_ips.includes(ip)) {
            console.log('valid postback attempt from: ' + ip);
            return next();
        } else {
            console.log('invalid postback attempt from: ' + ip);
            return res.end();
        }
    });

    app.use('/admin', function(req, res, next) {
        // filtering here, calls `res` method to stop progress or calls `next` to proceed
        let ip = req.headers['cf-connecting-ip'];
        console.log(ip + ' attempting connection to /admin');

        let authorized_ips = process.env.ADMIN_IPS.split(', ');
        // Our IPs
        if (authorized_ips.includes(ip)) {
            return next();
        } else {
            return res.redirect('/');
        }
    });
}


let sitemap = sm.createSitemap({
    hostname: 'https://gamecat.co',
    cacheTime: 600000,
    urls: [
        {url: '/', changefreq: 'monthly', priority: 0.7},
        {url: '/signup', changefreq: 'weekly', priority: 0.8},
        {url: '/login', changefreq: 'weekly', priority: 0.8},
        {url: '/shop/', changefreq: 'weekly', priority: 0.7},
        {url: '/shop/amazon-gift-card', changefreq: 'weekly', priority: 0.5},
        {url: '/shop/riot-gift-card', changefreq: 'weekly', priority: 0.6},
        {url: '/shop/google-play-gift-card', changefreq: 'weekly', priority: 0.6},
        {url: '/shop/itunes-gift-card', changefreq: 'weekly', priority: 0.6},
        {url: '/shop/steam-gift-card', changefreq: 'weekly', priority: 0.6},
        {url: '/shop/psn-gift-card', changefreq: 'weekly', priority: 0.6},
        {url: '/shop/xbox-gift-card', changefreq: 'weekly', priority: 0.6},
        {url: '/about/', changefreq: 'monthly', priority: 0.3},
        {url: '/contact/', changefreq: 'monthly', priority: 0.3},
    ]
});

app.get('/sitemap.xml', function(req, res){
    sitemap.toXML( function(err, xml) {
        if(err) {
            return res.status(500).end();
        }
        res.set('Content-Type', 'application/xml');
        return res.send(xml);
    });
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
app.use('/login', login);
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

scheduler.createDailyBonusReset();
