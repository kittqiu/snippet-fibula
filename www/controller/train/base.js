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
	modelCourse = db.train_course,
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

function* $course_list(offset, limit){
	var sql = 'select c.*, u.name as owner_name from train_course as c left join users as u on u.id=c.owner_id '
		+ ' order by c.created_at desc ',
		rs;
	if( offset !== undefined ){
		sql += ' limit ? offset ?';
		offset = offset ? offset : 0;
		limit = limit ? limit : 10;
		offset = offset < 0 ? 0: offset;
		limit = limit < 0 ? 10 : limit;
		rs = yield warp.$query(sql, [limit, offset]);
	}else{
		rs = yield warp.$query(sql, []);	
	}
	return rs;
}

function* $course_count(){
	return yield modelCourse.$findNumber( {
				select: 'count(*)'
			});
}

module.exports = {
	modelCourse: modelCourse,

	setHistoryUrl: setHistoryUrl,
	getHistoryUrl: getHistoryUrl,
	$render: $render,
	validate: json_schema.validate,
	next_id: next_id,


	/***cache***/
	cache: {
		
	},

	config: {
		PAGE_SIZE: config.train.page_size
	},


	user: {
		$list: team_base.member.$getUsers,
		$havePerm: team_base.$havePerm,
		$testPerm: team_base.$testPerm
	},

	course: {
		$list: $course_list,
		$count: $course_count
	}
	
};