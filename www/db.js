'use strict';

// init mysql-warp and expose all models under dir 'models':

console.log('init mysql with mysql-warp...');

var
	_ = require('lodash'),
	Warp = require('mysql-warp'),
	next_id = require('./model/_id'),
	config = require('./config'),
	thunkify = require('thunkify'),
	fs = require('fs');

// init database:
var warp = Warp.create(config.db);

warp.$transaction = thunkify(warp.transaction);
warp.$query = thunkify(warp.query);
warp.$queryNumber = thunkify(warp.queryNumber);
warp.$update = thunkify(warp.update);

var baseModel = warp.__model;

baseModel.$find = thunkify(baseModel.find);
baseModel.$findAll = thunkify(baseModel.findAll);
baseModel.$findNumber = thunkify(baseModel.findNumber);
baseModel.$create = thunkify(baseModel.create);
baseModel.$update = thunkify(baseModel.update);
baseModel.$destroy = thunkify(baseModel.destroy);

// export warp and all model objects:
var dict = {
    warp: warp,
    next_id: next_id
};

var MODELPATHS = [
	'./model',
	'./model/snippet',
	'./model/system'
];

function loadModels( relativepath ){
	// load all models:
	var files = fs.readdirSync( __dirname + '/' + relativepath);
	var re = new RegExp("^[A-Za-z][A-Za-z0-9\\_]*\\.js$");

	var models = _.map(_.filter(files, function (f) {
	    return re.test(f);
	}), function (fname) {
	    return fname.substring(0, fname.length - 3);
	});

	_.each( models, function( modelName ){
		console.log('found model: ' + modelName);
		var model = require( relativepath + '/' + modelName)(warp);
		// thunkify all database operations:
		_.each( ['find', 'findAll', 'findNumber', 'create', 'update', 'destroy'], function(key){
			model['$'+key] = thunkify(model[key]);
		});
		dict[modelName] = model;
	});
}

// load all models:
/*var files = require('fs').readdirSync(__dirname + '/model');
var re = new RegExp("^[A-Za-z][A-Za-z0-9\\_]*\\.js$");

var models = _.map(_.filter(files, function (f) {
    return re.test(f);
}), function (fname) {
    return fname.substring(0, fname.length - 3);
});


_.each( models, function( modelName ){
	console.log('found model: ' + modelName);
	var model = require('./model/' + modelName)(warp);
	// thunkify all database operations:
	_.each( ['find', 'findAll', 'findNumber', 'create', 'update', 'destroy'], function(key){
		model['$'+key] = thunkify(model[key]);
	});
	dict[modelName] = model;
});*/

_.each( MODELPATHS, function(path){
	loadModels(path);
});

module.exports = dict;