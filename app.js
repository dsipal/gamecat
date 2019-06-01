var http = require('http');
var express = require('express');
var exphbs = require('express-handlebars');
var session = require('express-session');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var MongoStore = require('connect-mongo')(session);


var app = express();

app.engine( 'hbs', exphbs( {
	extname: 'hbs',
	defaultView: 'default',
	layoutsDir: __dirname + '/app/server/views/layouts/',
	partialsDir: __dirname + '/app/server/views/partials/'
}));
app.locals.pretty = true;
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/app/server/views');
app.set('view engine', 'hbs');
app.set('view cache', app.get('env') == 'live');
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(require('stylus').middleware({ src: __dirname + '/app/public' }));
app.use(express.static(__dirname + '/app/public'));

// build mongo database connection url //

if (app.get('env') == 'live'){
	process.env.DB_HOST = process.env.MONGODB_URI;
	process.env.DB_PORT = process.env.DB_PORT || 63996;
	process.env.DB_NAME = process.env.DB_NAME || 'heroku_f9fjvqkf';
	process.env.DB_URL =  process.env.MONGODB_URI;
}	else {
// prepend url with authentication credentials //
	process.env.DB_HOST = process.env.DB_HOST || 'localhost';
	process.env.DB_PORT = process.env.DB_PORT || 27017;
	process.env.DB_NAME = process.env.DB_NAME || 'node-login';
	process.env.DB_URL = 'mongodb://'+process.env.DB_HOST+':'+process.env.DB_PORT;
}

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

require('./app/server/routes')(app);

http.createServer(app).listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});
