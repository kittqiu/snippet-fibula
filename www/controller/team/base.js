'use strict';

var 
	db = require( __base + 'db'),
	config = require( __base + 'config'),
	co = require('co'),
    perm = require( __base + 'controller/system/permission'),
    api = require( __base + 'api');

var 
	warp = db.warp,
	next_id = db.next_id, 
	modelUser = db.user,
	modelDep = db.team_department,
	modelMember = db.team_member,
	modelEvaluation = db.team_evaluation,
	DEP_ROOT = 'root',
	DEFAULT_EXPIRES_IN_MS = 1000 * config.session.expires,
	PERM_EDIT_STRUCTURE = 'team.structure.edit',
	PERM_CREATE_PROJECT = 'project.create';


function* co_module_init(){
	var pid = yield perm.perm.$register(PERM_EDIT_STRUCTURE, '有权修改部门架构树');
	var rid = yield perm.role.$register('团队规划师', '规划团队结构');
	yield perm.role.$registerPerm(rid, pid);

	pid = yield perm.perm.$register(PERM_CREATE_PROJECT, '有权创建项目');
	rid = yield perm.role.$register('项目管理员', '项目管理');
	yield perm.role.$registerPerm(rid, pid);
}

function MODULE_init(){
	co( co_module_init ).then( function (val) {
		 }, function (err) {
		  console.error(err.stack);
		});
}
MODULE_init();


function* $_getDepartment(id){
	if( id === DEP_ROOT ){
		return {name:DEP_ROOT, id:DEP_ROOT};
	}else{
		return yield modelDep.$find(id);
	}
}

function* $_getDepartment(id){
	if( id === DEP_ROOT ){
		return {name:DEP_ROOT, id:DEP_ROOT};
	}else{
		return yield modelDep.$find(id);
	}
}

function* $department_isLeaf(id){
	var cnt = yield modelDep.$findNumber({
		select: 'count(*)',
		where: '`parent`=?',
		params:[id]
	});
	return cnt === 0;
}

function* $department_changeOrder(id, offset){
	var dep = yield modelDep.$find(id),
		orgorder =  dep.order,
		order = orgorder + offset,
		maxorder = yield $department_getMaxOrder(dep.parent);
	if( order < 0 ){
		order = 0;
	}
	if( order > maxorder ){
		order = maxorder;
	}
	offset = order - dep.order;
	if( offset !== 0 ){
		if( offset > 0 ){
			yield warp.$query( 'update team_department set `order`=`order`-1 where `parent`=? and `order`<=? and `order` >?', [dep.parent, order, orgorder]);
		}else{
			yield warp.$query( 'update team_department set `order`=`order`+1 where `parent`=? and `order`<? and `order` >=?', [dep.parent, orgorder, order]);
		}
		dep.order = order;
		yield dep.$update(['order']);
	}	
}

function* $department_deleteOrder(pid, order){
	yield warp.$query( 'update team_department set `order`=`order`-1 where `parent`=? and `order`>? ', [pid, order]);
}

function* $department_getMaxOrder(id){
	var sql = 'select MAX(`order`) AS maxorder from team_department where parent=?',
    	rs = yield warp.$query( sql, [id] );
    return rs.length > 0? rs[0].maxorder: -1;
}

function* $department_list(){
	return yield modelDep.$findAll({
		select: ['id', 'name', 'parent', 'order']
	});
}

/***** member*******/
function* $member_getFree(){
	var sql = "select u.id,u.name from users as u LEFT JOIN team_member as m on u.id=m.user_id where u.actived=1 and u.verified=1 and m.department is null or m.department =''";
	return yield warp.$query(sql);
}

function* $member_getUser(uid){
	var r = yield modelMember.$find({
		select: '*',
		where: '`user_id`=?',
		params: [uid]
	});
	return r;
}

function* $member_collectUser(uid){
	var sql = "select u.id,u.name, m.* from users as u LEFT JOIN team_member as m on u.id=m.user_id where u.id=?";
	var rs = yield warp.$query(sql, [uid]);
	return rs[0];
}

function* $member_isAdmin(uid){
	var u = yield modelUser.$find(uid);
	if( u !== null ){
		return u.role===0 && u.username === 'Admin';
	}
	return false;
}

function* $department_listUsers(){
	var sql = "select u.id, u.name, m.department from users as u,team_member as m where u.id=m.user_id and m.department <>''";
	return yield warp.$query(sql);
}

function* $_member_create(uid, dep){

	var m = {
		id: next_id(),
		user_id: uid,
		department: dep || '',
		time_work:0,
		time_join:0,
		birthday:0,
		card_id:'',
		telephone:'',
		work_number:''		
	}
	yield modelMember.$create(m);
	return m.id;
}

function* $_member_getUsers(contain_unactived){
	var sql = "select u.id, u.name from users as u where  u.verified=1" + ((!!contain_unactived) ? '' : " and u.actived=1");
	return yield warp.$query(sql);
}

function* $_evaluation_get(uid, year, month){
	var day = new Date( year, month, 15 );
	var r = yield modelEvaluation.$find({
			select: '*',
			where: '`time`=? && `user_id`=?',
			params: [day.getTime(), uid]
	});
	return r || {};
}

function* $_evaluation_create(uid, date, evaluation){
	date = new Date( date.getFullYear(), date.getMonth(), 15 );
	var r = {
			user_id: uid,
			manager_id: '',
			time: date.getTime(),
			evaluation: JSON.stringify( evaluation )
		};
	yield modelEvaluation.$create( r );
	return true
}

function* $_havePerm(context,perm_name){
	return yield perm.user.$havePerm(context.request.user.id, perm_name);
}

function* $_testPerm(context,perm_name){
	if( yield $_havePerm(context,perm_name) ){
		return true;
	}else{
		throw api.authFailed(perm_name, '您无权限访问!');
	}
}

function setHistoryUrl( context, url ){
    if( arguments.length === 1){
        url = context.request.url;
    }
    context.cookies.set( 'TEAM_HISTORYURL', url, {
        path: '/',
        httpOnly: true,
        expires: new Date(Date.now()+DEFAULT_EXPIRES_IN_MS)
    });
}

function getHistoryUrl( context ){
    var url = context.cookies.get('TEAM_HISTORYURL');
    return url || '/team/';
}

module.exports = {
	$getDepartment: $_getDepartment,
	$member_create: $_member_create,

	department: {
		$list: $department_list,
		$listUsers: $department_listUsers,
		$changeOrder: $department_changeOrder,
		$getMaxOrder: $department_getMaxOrder,
		$deleteOrder: $department_deleteOrder,
		$isLeaf: $department_isLeaf
	},

	member: {
		$getUsers: $_member_getUsers,
		$getFree: $member_getFree,
		$getUser: $member_getUser,
		$listRoles: perm.user.$listRoles,
		$havePerm: perm.user.$havePerm,
		$collectUser: $member_collectUser,
		$isAdmin: $member_isAdmin
	},

	evaluation: {
		$get: $_evaluation_get,
		$create: $_evaluation_create
	},

	perm: perm,

	$havePerm: $_havePerm,
	$testPerm: $_testPerm,

	setHistoryUrl: setHistoryUrl,
	getHistoryUrl: getHistoryUrl,

	PERM_EDIT_STRUCTURE: PERM_EDIT_STRUCTURE,
	PERM_CREATE_PROJECT: PERM_CREATE_PROJECT
};