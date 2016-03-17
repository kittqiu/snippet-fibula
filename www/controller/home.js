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
	model.__production__ = PRODUCTION;
	//model.__navigations__ = yield
	model.__website__ = yield settingApi.$getWebsiteSettings();
	console.log(model)
	return model;
}


module.exports = {
	$getModel: $getModel,

	'GET /': function* (){
		var model = {};
		this.redirect( config.home );
		//this.render( getView('index.html'), yield $getModel.apply(this, [model]) );
	},
	'GET /signup': function* (){
		var model = { __salt__:  config.security.salt };
		this.render( getView('system/signup.html'), yield $getModel.apply(this, [model]) );
	},
	'GET /login': function* (){
		var model = { __salt__:  config.security.salt };
		console.log( "get login");
		this.render( getView('system/login.html'), yield $getModel.apply(this, [model]) );
	},
	'GET /user/changepassword': function* (){
		var model = { __salt__:  config.security.salt };
		this.render( getView('system/changepassword.html'), yield $getModel.apply(this, [model]) );
	}
};
