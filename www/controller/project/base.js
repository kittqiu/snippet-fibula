'use strict';

var 
	_ = require('lodash'),
	fs = require('fs'),
	home = require('../home'),
    config = require('../../config'),
    db = require('../../db'),
    api = require('../../api'), 
    cache = require('../../cache'),
    json_schema = require('../../json_schema'),
    team_base = require( __base + 'controller/team/base');

var models = {
    next_id: db.next_id,
    warp : db.warp
};

var 
	modelUser = db.user,
	modelProject = db.project,
	warp = models.warp;


var 
	DEFAULT_EXPIRES_IN_MS = 1000 * config.session.expires,
    PARENT_ROOT = 'root';


function* $_render( context, model, view ){
    context.render( 'project/' + view, yield home.$getModel.apply(context, [model]) );
}

function setHistoryUrl( context, url ){
    if( arguments.length === 1){
        url = context.request.url;
    }
    context.cookies.set( 'PROJECT_HISTORYURL', url, {
        path: '/',
        httpOnly: true,
        expires: new Date(Date.now()+DEFAULT_EXPIRES_IN_MS)
    });
}

function getHistoryUrl( context ){
    var url = context.cookies.get('PROJECT_HISTORYURL');
    return url || '/project/';
}

/***** project *****/
function* $project_list(offset, limit){
	offset = offset ? offset : 0;
	limit = limit ? limit : 10;
	offset = offset < 0 ? 0: offset;
    limit = limit < 0 ? 10 : limit;

    var sql = 'select p.id, p.creator_id, p.master_id, u.name as master_name, p.name, p.start_time, p.end_time, p.status,p.details from project as p, ' 
    	+ 'users as u where u.id = p.master_id order by p.created_at desc limit ? offset ? ';
	return yield warp.$query(sql, [limit, offset]);
}

function* $project_get(id){
	var p = yield modelProject.$find(id);
	if( p !== null ){
		var u = yield modelUser.$find(p.master_id);
		if( u !== null ){
			p.master_name = u.name;
		}
		if( p.master_id !== p.creator_id ){
			u = yield modelUser.$find(p.creator_id);
			if( u !== null ){
				p.creator_name = u.name;
			}
		}else{
			p.creator_name = p.master_name;
		}		
	}
	return p || {};
}

var statusOptions = [
	{value:'planning', title:'筹备中'},
	{value:'running', title:'正在执行'},
	{value:'pending', title:'挂起'},
	{value:'cancel', title:'取消'},
	{value:'end', title:'结束'},
];
function project_optionStatus(){
	return statusOptions;
}


/**********cache*********/



module.exports = {

	modelProject: modelProject,

	$render: $_render,
	setHistoryUrl: setHistoryUrl,
	getHistoryUrl: getHistoryUrl,
	validate: json_schema.validate,


	/***cache***/
	cache: {
		
	},

	project: {
		$list: $project_list,
		$get: $project_get,
		statusOptions: project_optionStatus
	},

	user: {
		$list: team_base.member.$getUsers
	}
	
};


