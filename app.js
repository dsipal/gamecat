// imports //
var http = require('http');
var express = require('express');
var exphbs = require('express-handlebars');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);
var sassMiddleware = require('node-sass-middleware');
var passport = require('passport')
	,	LocalStrategy = require('passport-local').Strategy;

// create instance of express server //
var app = express();
app.set('port', process.env.PORT || 8080);

// setup handlebars templating //
app.engine('hbs', exphbs( {
	extname: 'hbs',
	defaultView: 'default',
	layoutsDir: __dirname + '/app/server/views/layouts/',
	partialsDir: __dirname + '/app/server/views/partials/'
}));
app.set('view engine', 'hbs');

// setup SASS compiler middleware //
app.use(
	sassMiddleware({
		src: __dirname + '/app/server/views/', //where the sass files are
		dest: __dirname + '/app/public/', //where css should go
		debug: true // obvious
	})
);

// set up view handling //
app.set('views', __dirname + '/app/server/views');
app.set('view cache', app.get('env') === 'live');
app.use(express.static(__dirname + '/app/public'));

// set up cookie-parser middleware //
app.use(cookieParser());

// set up body-parser middleware //
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// build mongo database connection url //
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

// setup express-sessions //
app.use(session({
		secret: 'faeb4453e5d14fe6f6d04637f78077c76c73d1b4',
		proxy: false,
		resave: false,
		saveUninitialized: false,
		store: new MongoStore({
			url: process.env.DB_URL,
			touchAfter: 3600
		})
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
