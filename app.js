/**
 * Module dependencies.
 */

process.on('uncaughtException', function (err) {
    console.log("Uncaught Exception", err)
});

var express = require('express')
    , http = require('http')
    , path = require('path')
    , ejs = require('ejs')
    , fs = require('fs')


var app = express();
app.locals.render = ejs.render;

//CORS middleware
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.enable('trust proxy');
    app.use(express.favicon(__dirname + '/public/assets/ico/favicon.ico', { maxAge: 2592000000 }));
    app.use(function (req, res, next) {
        res.locals.path = req.path;
        var experiment_pages = ['/', '/index', '/index_graph', '/index_graph_svg'];
        res.locals.index_page = experiment_pages.indexOf(req.path) != -1;
        res.locals.run_experiment = app.get('env') == 'production' && res.locals.index_page;
        next();
    });
    app.use(allowCrossDomain);
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('value in relationships'));
    app.use(express.session());
    app.use(express.static(path.join(__dirname, 'public')));
});

app.get('/gists/:gist', function(req, res){
    res.render('index',{gist:req.params.gist});
});

app.get('/', function(req, res){
    res.redirect("/gists/5857879");
});

http.createServer(app).listen(app.get('port'), function () {
    
    console.log("Express server listening on port " + app.get('port'));
});
