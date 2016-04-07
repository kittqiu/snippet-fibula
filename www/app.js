'use strict';

process.productionMode = (process.env.NODE_ENV === 'production');

var 
	_ = require("lodash"),
	fs = require("fs"),
	koa = require("koa"),
	route = require('koa-route'),
	bodyParser = require('koa-bodyparser'),
	swig = require('swig'),	
	config = require('./config'),
	i18n = require('./i18n'),
	cache = require( './cache'),
	api_console = require('./api_console'),
	app = koa(),//global app
	auth = require('./auth'),
	constants = require('./constants');

var 
	db = require('./db');

global.__base = __dirname + '/';

app.name = 'snippet-fibula';
app.proxy = true;

//load i18n
var i18nT = i18n.getI18NTranslators('./view/i18n');


/* On producton, serve static files by http container.
 * Otherwise by nodejs.
 */
function serveStatic(){
	var root = __dirname;
	app.use( function* (next){
		var
			method = this.request.method,
			path = this.request.path,
			pos;

		if( method === 'GET' && (path.indexOf('/static/') === 0 || path === '/favicon.ico')){
			console.log('>>> static path: ' + path);
			pos = path.lastIndexOf('.');
			if( pos !== -1 ){
				this.type = path.substring(pos);
			}
			this.body = fs.createReadStream( root + path );
			return;
		}else{
			yield next;
		}
	});
}

/* locate before other middleware*/
if( process.productionMode ){
	app.on( 'error', function(err){
		console.error(new Date().toISOString() + ' [Unhandled ERR] ', err);
	});
	serveStatic();
}else{
	serveStatic();
}

function logJSON(data){
	if(data){
		console.log( JSON.stringify(data, function(key, value){
			if( key === 'image' && value ){
				return value.substring(0,20) + ' (' + value.length + ' bytes image data) ...';
			}
			return value;
		}));
	}else{
		console.log('(EMPTY)');
	}
}

app.use( auth.$userIdentityParser );

/*try to parse body to be a json object or a form object*/
app.use( bodyParser());

var 
	isDevelopment = !process.productionMode,
	static_prefix = config.cdn.static_prefix,
	activeTheme = config.theme,
	hostname = require('os').hostname(),
	swigTemplatePath = __dirname + '/view/';// set view template

swig.setDefaults({
    cache: process.productionMode ? 'memory' : false
});
function swFind(input,str) { return input.indexOf(str) !== -1; }
swig.setFilter('find', swFind);

function swURL(input,str) { 
	input = input.replace(/\+/g, '%2B');
	input = input.replace(' ', '+');
	input = input.replace(/#/g, '%23');	
	input = input.replace(/\//g, '%2F');
	return input;
}
swig.setFilter('url', swURL);

function swTimeToDate(input,str) {
	var date = new Date(input);
    return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate();
}
swig.setFilter('time2Date', swTimeToDate);

function swTimeToTime(input,str) {
	var date = new Date(input);
    return date.getFullYear() + '-' + (date.getMonth()+1) + '-' + date.getDate() 
    		+ ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
}
swig.setFilter('time2time', swTimeToTime);

/*define template render function, log execution time and catch the exception*/
app.use( function* theMiddleWare(next){
	var 
		request = this.request,
		response = this.response,
		method = request.method,
		path = request.path,
		prefix8 = path.substring( 0, 8 ),
		prefix4 = path.substring( 0, 4 ),
		start = Date.now(),//start time
		execTime,
		isApi = path.indexOf('/api/') === 0 ;

	console.log('[%s] %s %s', new Date().toISOString(), method, path);
	

    if (prefix8 === '/manage/' && request.path !== '/manage/signin') {
        if (! request.user || request.user.role > constants.role.DEVELOPER) {
            response.redirect('/manage/signin');
            return;
        }
    }

    this.translate = i18n.createI18N( request.get('Accept-Language') || 'en', i18nT );
    if( isApi ){
    	if( isDevelopment ){
    		console.log('[API Request]');
    		logJSON( request.body );
    	}
    }else{
    	this.render = function( template, model){
    		model._ = i18n.createI18N( request.get('Accept-Language') || 'en', i18nT );
    		model.__static_prefix = static_prefix;
    		model.__user__ = request.user;
    		model.__time__ = start;
    		model.__theme__ = activeTheme;
    		model.__request__ = request;
    		var renderHtml = swig.renderFile( swigTemplatePath + template, model );
    		response.body = renderHtml;
    		response.type = '.html';
    	};
    }

    try{
    	if(auth.loginRequired(this)){//GET method and require login
    		return;
    	}else{
    		yield next;//action now
    	}
    	
    	execTime = String(Date.now() - start);
    	response.set('X-Cluster-Node', hostname);
    	response.set( 'X-Execution-Time', execTime );    	
    	if (response.status === 404) {
            this.throw(404);
        }
    }catch(err){
    	execTime = String(Date.now() - start);
        response.set('X-Execution-Time', execTime);
        console.log('X-Execution-Time: ' + execTime);
        console.log('[Error] error when handle url: ' + request.path);
        console.log(err.stack);
        if (err.code && err.code === 'POOL_ENQUEUELIMIT') {/*system error: mysql connect pool*/
            // force kill node process:
            console.error(new Date().toISOString() + ' [FATAL] POOL_ENQUEUELIMIT, process exit 1.');
            process.exit(1);
        }
        if (isApi) {
            // API error:
            response.body = {
                error: err.error || (err.status === 404 ? '404' : '500'),
                data: err.data || '',
                message: err.status === 404 ? 'API not found.' : (err.message || 'Internal error.')
            };
        }
        else if (err.status === 404 || err.error === 'entity:notfound') {
            response.body = '404 Not Found'; //this.render('404.html', {});
        }
        else if( err.error === 'auth:failed'){
        	this.redirect('/sys/error/auth');
        }
        else {
            console.error(new Date().toISOString() + ' [ERROR] 500 ', err.stack);
            response.body = '500 Internal Server Error'; //this.render('500.html', {});
        }
        if (execTime > 1000) {
            console.error(new Date().toISOString() + ' [ERROR] X-Execution-Time too long: ' + execTime);
        }
    }

    /*log the response on api request*/
    if (isApi) {
        if (isDevelopment) {
            console.log('[API Response]');
            logJSON(response.body);
        }
    }
});

/*
 * scan controller directory and load all modules
 */

function registerRoute(method, path, fn){
	if( method === 'GET' ){
		console.log( "found route: GET %s", path );
		app.use( route.get(path,fn));
	}else if( method === 'POST'){
		console.log( "found route: POST %s", path );
		app.use( route.post(path,fn));
	}
}

//return file name array
function loadControllerFileNames(){
	var files = fs.readdirSync( __dirname + "/controller" ),
		re = new RegExp( "^[A-Za-z][A-Za-z0-9\\_]*\\.js$"),
		jss = _.filter( files, function(f){
			return re.test(f);
		});
		console.log( jss );
	return _.map( jss, function(f){
		return f.substring(0, f.length-3);
	});
}

/* find *Api.js in controller sub directory and load it*/
function loadApiModule(parent, ctrls){
	var files = fs.readdirSync( __dirname + '/' + parent ),
		re = new RegExp( "^[A-Za-z][A-Za-z0-9\\_]*Api\\.js$"),
		jss = _.filter( files, function(f){
			return re.test(f);
		}),
		modules = _.map( jss, function(f){
			return f.substring(0, f.length-3);
		}),
		pkg = parent.replace('/', '.');

	_.each(modules, function(module){
		var cls = parent +'/' + module;
		ctrls[cls] = require( parent + '/' + module );
		console.log('load module: cls(' + cls + '), mod(' + parent + '/' + module + ')');
	});

	_.each( files, function(f){
		var file = parent + '/' + f;
		if( fs.statSync( __dirname + '/' + file).isDirectory()){
			_.merge( ctrls, loadApiModule(file, {}));
		}
	});
	return ctrls;
}

function loadControllerSubSystem(){
	var ctrls = {},
		parent = "./controller",
		files = fs.readdirSync( __dirname + '/' + parent );

	_.each( files, function(f){
		var file = parent + '/' + f;
		if( fs.statSync( __dirname + '/' + file).isDirectory()){
			_.merge( ctrls, loadApiModule(file, {}));
		}
	});
	return ctrls;
}

//load modules by require statments
function loadControllers(){
	var ctrls = {};
	_.each( loadControllerFileNames(), function(filename){
		ctrls[filename] = require('./controller/' + filename );
	});
	_.merge( ctrls, loadControllerSubSystem());
	return ctrls;
}

var controllers = loadControllers();

/*register routes*/
_.each(controllers, function(ctrl, filename){
	_.each( ctrl, function(fn, path){
		var ss, method, route, docs;

		if( path === 'LoginRequired'){
			auth.registerAuthPaths(fn);
			return;
		}

		ss = path.split(' ', 2);
		if( ss.length !== 2 ){
			console.log( "Invalid route definition: " + path );
			return;
		}

		method = ss[0];
		route = ss[1];
		if( method === 'GET' ){
			console.log("found: GET " + route + " in " + filename + ".js");
			registerRoute( "GET", route, fn );
		}else if( method === 'POST'){
			console.log("found: POST " + route + " in " + filename + ".js");
			registerRoute( "POST", route, fn );
		}else{
			console.log( "Invalid method:" + method );
		}

		if (route.indexOf('/api/') === 0) {
            docs = fn.toString().match(/[\w\W]*\/\*\*?([\d\D]*)\*?\*\/[\w\W]*/);
            if (docs) {
                api_console.processApiDoc(filename, method, route, docs[1]);
            } else {
                console.log('WARNING: no api docs found for api: ' + route);
            }
        }
	});
});


app.listen(config.port);
console.log( 'application start in %s mode at %d', (process.productionMode ? 'production' : 'development', config.port));
