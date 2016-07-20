'use strict';

var 
	db = require( __base + 'db'),
	api = require( __base + 'api'),
	home = require( __base + 'controller/home'), 
	json_schema = require( __base + 'json_schema'),
	base = require('./base');

function* $_render( context, model, view ){
    context.render( 'manage/' + view, yield home.$getModel.apply(context, [model]) );
}

/**************
GET METHOD:
/manage
/manage/config/workday
/manage/project
/manage/user/role
/manage/user


POST METHOD:

*************/

module.exports = {
	'GET /manage': function* (){
		yield $_render( this, {}, 'manage_index.html');
		base.setHistoryUrl(this);
	},
	'GET /manage/config/workday': function* (){
		yield $_render( this, {}, 'config_workday.html');
		base.setHistoryUrl(this);
	},
	'GET /manage/user': function* (){
		yield $_render( this, {}, 'user.html');
		base.setHistoryUrl(this);
	},
	'GET /manage/user/role': function* (){
		yield $_render( this, {}, 'role.html');
		base.setHistoryUrl(this);
	},
	'GET /manage/user/role': function* (){
		yield $_render( this, {}, 'role.html');
		base.setHistoryUrl(this);
	},

	'GET /manage/project': function* (){
		yield $_render( this, {}, 'project.html');
		base.setHistoryUrl(this);
	},

	'LoginRequired': [ /^\/manage[\s\S]*/, /^\/api\/manage[\s\S]*/]
};