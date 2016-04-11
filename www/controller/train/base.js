'use strict';

var 
	_ = require('lodash'),
	fs = require('fs'),
	home = require('../home'),
	config = require( __base + 'config'),
	db = require( __base + 'db'),
	api = require( __base + 'api'), 
	cache = require( __base + 'cache'),
	json_schema = require( __base + 'json_schema'),
	team_base = require( __base + 'controller/team/base'),
	helper = require( __base + 'helper'),
	co = require('co'), 
	perm = require( __base + 'controller/system/permission');

var 
	modelUser = db.user,
	next_id = db.next_id,
	warp = db.warp;
var 
	DEFAULT_EXPIRES_IN_MS = 1000 * config.session.expires;

function* init_database(){
	//perm.perm.$register('')
}

function MODULE_init(){
	co( init_database ).then( function (val) {
		 }, function (err) {
		  console.error(err.stack);
		});
}
MODULE_init();

function setHistoryUrl( context, url ){
	if( arguments.length === 1){
		url = context.request.url;
	}
	context.cookies.set( 'TRAIN_HISTORYURL', url, {
		path: '/',
		httpOnly: true,
		expires: new Date(Date.now()+DEFAULT_EXPIRES_IN_MS)
	});
}

function getHistoryUrl( context ){
	var url = context.cookies.get('TRAIN_HISTORYURL');
	return url || '/train/';
}

function* $render( context, model, view ){
    context.render( 'train/' + view, yield home.$getModel.apply(context, [model]) );
}

module.exports = {

	setHistoryUrl: setHistoryUrl,
	getHistoryUrl: getHistoryUrl,
	$render: $render,
	validate: json_schema.validate,


	/***cache***/
	cache: {
		
	},

	config: {
	},


	user: {
		$list: team_base.member.$getUsers,
		$havePerm: team_base.$havePerm,
		$testPerm: team_base.$testPerm
	}
	
};