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
	modelMember = db.project_member,
	modelGroup = db.project_member_group,
	modelTask = db.project_task,
	modelTaskRely = db.project_task_rely,
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

/* get: project record, creator name, master name, groups, members*/
function* $project_get(id){
	var sql,
		p = yield modelProject.$find(id);
	if( p !== null ){
		//add master name
		var u = yield modelUser.$find(p.master_id);
		if( u !== null ){
			p.master_name = u.name;
		}

		//add creator name
		if( p.master_id !== p.creator_id ){
			u = yield modelUser.$find(p.creator_id);
			if( u !== null ){
				p.creator_name = u.name;
			}
		}else{
			p.creator_name = p.master_name;
		}

		//add groups and members
		p.groups = yield modelGroup.$findAll({
			select: '*',
			where: '`project_id`=?',
			params: [id]
		});
		sql = 'select m.*, u.`name` from project_member as m, users as u where m.user_id = u.id and m.project_id=?';
		p.members = yield warp.$query(sql, [id]);
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

var roleOptions = [
	{ value: 'leader', title: '负责人'},
	{ value: 'manager', title: '管理兼执行'},
	{ value: 'executor', title: '执行成员'}
];
function project_optionRole(){
	return roleOptions;
}

function getRoleName(v){
	for(var i = 0; i < roleOptions.length; i++ ){
		var r = roleOptions[i];
		if( r.value === v){
			return r.title;
		}
	}
	return '';
}

function* $project_getMembers(id){
	var sql = 'select m.*, u.`name` from project_member as m, users as u where m.user_id = u.id and m.project_id=?';
	return yield warp.$query(sql, [id]);
}

/* list all users, who has been not in the project */
function* $project_listOptionalUsers(id){
	var alls = yield team_base.member.$getUsers(),
		members = yield $project_getMembers(id), 
		ids = [], target = [];
	members.forEach(function(m){
		ids.push(m.user_id);
	});
	alls.forEach(function(u){
		if( ids.indexOf(u.id) === -1 ){
			target.push(u);
		}
	})
	return target;
}

function* $project_listTasks(id){
	/*var sql = 'select t.*, u.name as executor_name from project_task as t , users as u where t.executor_id = u.id and t.project_id=?';
	return yield warp.$query(sql, [id]);*/
	return yield modelTask.$findAll({
		select: '*',
		where: '`project_id`=?',
		order: '`order` asc',
		params: [id]
	});
}

function* $project_listTaskRelies(id){
	return yield modelTaskRely.$findAll({
		select: '*',
		where: '`project_id`=?',
		params: [id]
	})
}

function* $task_maxOrder(project_id, parent_id){
	var sql = 'select MAX(`order`) AS maxorder from project_task where project_id=? and parent=?',
    	rs = yield warp.$query( sql, [project_id, parent_id] ),
    	maxorder = rs[0].maxorder;
    return maxorder === null ? -1 : maxorder;
}

function* $task_setRelies(tid, pid, relies){
	var rs = yield modelTaskRely.$findAll({
			select: '*',
			where: '`task_id`=?',
			params: [tid]
			}),
		rids = [], i;

	rs.forEach(function(r, i){
		rids.push(r.rely_task_id);
	});

	//create
	for( i = 0; i < relies.length; i++ ){
		var r = relies[i];
		if( rids.indexOf(r) === -1 ){
			var record = {
				project_id:pid,
				task_id: tid, 
				rely_task_id: r
			};
			yield modelTaskRely.$create(record);
		}
	}
	
	//delete
	for( i = 0; i < rs.length; i++ ){
		var r = rs[i];
		if( relies.indexOf(r.rely_task_id) === -1){
			yield r.$destroy();
		}
	}
}

function* $task_listRelies(id){
	var rs = yield modelTaskRely.$findAll({
		select: '*',
		where: '`task_id`=?',
		params: [id]
	}), 
	relies = [];
	rs.forEach( function(r, index) {
		relies.push(r.rely_task_id);
	});
	return relies;
}

function* $task_moveUp(id){
	var r = yield modelTask.$find(id);
	if( r.order !== 0 ){
		yield warp.$query( 'update project_task set `order`=`order`+1 where `project_id`=? and `parent`=? and `order`=?', 
				[r.project_id, r.parent, r.order-1]);
		r.order--;
		yield r.$update(['order']);
	}
}

function* $task_moveDown(id){
	var r = yield modelTask.$find(id),
		maxOrder = yield $task_maxOrder(r.project_id, r.parent);
	if( r.order !== maxOrder ){
		yield warp.$query( 'update project_task set `order`=`order`-1 where `project_id`=? and `parent`=? and `order`=?', 
				[r.project_id, r.parent, r.order+1]);
		r.order++;
		yield r.$update(['order']);
	}
}

function* $task_changeParent(task_id, parent_id){
	var r = yield modelTask.$find(task_id);
	if( parent_id !== 'root'){
		var parent = yield modelTask.$find(parent_id);
		if( parent === null )
			return false;
	}
		
	yield warp.$query( 'update project_task set `order`=`order`-1 where `project_id`=? and `parent`=? and `order`>?', 
				[r.project_id, r.parent, r.order]);
	var maxOrder = yield $task_maxOrder(r.project_id, parent_id);
	r.parent = parent_id;
	r.order = maxOrder + 1;
	yield r.$update(['parent', 'order']);
}


function* $group_getMembers(id){
	var sql = 'select m.*, u.`name` from project_member as m, users as u where m.user_id = u.id and m.group_id=?';
	return yield warp.$query(sql, [id]);
}

function* $group_get(id){
	var g = yield modelGroup.$find(id);
	if( g !== null ){
		var members = yield $group_getMembers(id);
		g.members = members;
		members.forEach(function(m){
			m.role_name = getRoleName(m.role);
		});
	}
	return g || {};
}



/**********cache*********/



module.exports = {

	modelProject: modelProject,
	modelGroup: modelGroup,
	modelMember: modelMember,
	modelTask: modelTask,
	modelTaskRely: modelTaskRely,

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
		statusOptions: project_optionStatus,
		roleOptions: project_optionRole,
		$listOptionalUsers: $project_listOptionalUsers,
		$listTasks : $project_listTasks,
		$listTaskRelies: $project_listTaskRelies
	},

	group: {
		$getMembers: $group_getMembers,
		$get: $group_get		
	},

	task: {
		$maxOrder: $task_maxOrder,
		$setRelies: $task_setRelies,
		$listRelies: $task_listRelies,
		$moveUp: $task_moveUp,
		$moveDown: $task_moveDown,
		$changeParent: $task_changeParent
	},

	user: {
		$list: team_base.member.$getUsers
	}
	
};


