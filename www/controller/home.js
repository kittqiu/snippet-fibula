'use strict';

// home.js

var 
	_ = require('lodash'),
	api = require('../api'),
	db = require('../db'),
	config = require('../config'),
	cache = require('../cache'),
	constants = require('../constants'),
	json_schema = require('../json_schema');

var 
	settingApi = require('./settingApi');

var 
	THEME = config.theme,
	PRODUCTION = process.productionMode;


function getView(view){
	return '' + view;
}

function* $getModel(model){
	console.log( PRODUCTION );
	model.__production__ = PRODUCTION;
	//model.__navigations__ = yield
	model.__website__ = yield settingApi.$getWebsiteSettings();
	return model;
}


module.exports = {

	'GET /': function* (){
		var model = {};
		this.render( getView('index.html'), yield $getModel.apply(this, [model]) );
	},
	'GET /signup': function* (){
		var model = {};
		this.render( getView('signup.html'), yield $getModel.apply(this, [{model}]) );
	}
};
