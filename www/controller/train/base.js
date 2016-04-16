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
	perm = require( __base + 'controller/system/permission'),
	attop = require(__base +'controller/system/attachment');;

var 
	modelUser = db.user,
	modelCourse = db.train_course,
	modelSection = db.train_section,
	modelRes = db.train_resource,
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

function* $course_listSection( cid ){
	var sections = yield modelSection.$findAll({
			select: '*',
			where: '`course_id`=?',
			params: [cid]
		});
	if( sections.length > 0 ){
		var sql = 'select res.section_id, res.att_id, att.path, att.name from train_resource as res '
			+ ' left join attachment as att on res.att_id=att.id where res.course_id=?',
			rs = yield warp.$query( sql, [cid] ),
			i, j;

		for(i = 0; i < sections.length; i++　){
			var s = sections[i];
			s.atts = [];

			for(j = 0; j < rs.length; j++　){
				var r = rs[j];
				if( r.section_id === s.id ){
					s.atts.push(r);
				}
			}
		}
	}
	return sections;
}

function* $section_getMaxOrder(course_id){
	var sql = 'select MAX(`order`) AS maxorder from train_section where course_id=?',
    	rs = yield warp.$query( sql, [course_id] );
    return rs.length > 0? rs[0].maxorder: -1;
}

function* $section_addAttachments(section_id, course_id, atts){
	for( var i = 0; i < atts.length; i++ ){
		var r = {
				section_id: section_id,
				course_id: course_id,
				att_id: atts[i]
			};
		yield modelRes.$create(r);
		yield attop.$addRefer(atts[i]);
	}
}

function* $section_listAttachments(section_id){
	var sql = 'select s.att_id, a.name from train_resource as s left join attachment as a on s.att_id=a.id '
		+ ' where s.section_id=?';
	return yield warp.$query(sql, [section_id]);
}

function* $section_updateAttachments(section_id, course_id, atts){
	var ors, r, i, j, aid, found;
	ors = yield modelRes.$findAll({
			select: '*',
			where: '`section_id`=?',
			params: [section_id]
		});
	for( i = 0; i < atts.length; i++ ){
		aid = atts[i];
		found = false;
		for( j = 0; j < ors.length; j++ ){
			if( ors[j].att_id === aid ){
				ors.splice(j,1);
				found = true;
				break;
			}
		}
		if( !found ){//create on not found
			r = {
				section_id: section_id,
				course_id: course_id,
				att_id: aid
			};
			yield modelRes.$create(r);
			yield attop.$addRefer(aid);
		}
	}
	//delete old resource
	for( i = 0; i < ors.length; i++ ){
		r = ors[i];
		yield attop.$descRefer(r.att_id);
		yield r.$destroy();
	}
}

module.exports = {
	modelCourse: modelCourse,
	modelSection: modelSection,

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
		$count: $course_count,
		$listSection: $course_listSection
	},

	section: {
		$getMaxOrder: $section_getMaxOrder,
		$addAttachments: $section_addAttachments,
		$listAttachments: $section_listAttachments,
		$updateAttachments: $section_updateAttachments
	}

	
};