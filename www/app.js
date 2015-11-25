'use strict';

process.productionMode = (process.env.NODE_ENV === 'production');

var 
	_ = require("lodash"),
	fs = require("fs"),
	koa = require("koa"),
	route = require('koa-route'),
	bodyParser = require('koa-bodyparser'),
	config = require('./config'),
	app = koa();//global app

var 
	db = require('./db');

app.name = 'snippet-fibula';

app.use( bodyParser());

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
		re = new RegExp( "[A-Za-z][A-Za-z0-9\\_]*\\.js^$"),
		jss = _.filter( files, function(f){
			return re.test(f);
		});

	return _.map( jss, function(f){
		return f.substring(0, f.length-3);
	});
}

//load modules by require statments
function loadControllers(){
	var ctrls = {};
	_.each( loadControllerFileNames(), function(filename){
		ctrls[filename] = require('./controller/' + filename );
	});
	return ctrls;
}

var controllers = loadControllers();

/*register routes*/
_.each(controllers, function(ctrl, filename){
	_.each( ctrl, function(fn, path){
		var ss, method, route;
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
	});
});


app.listen(80);
console.log( 'application start in %s mode at 80', (process.productionMode ? 'production' : 'development'));
