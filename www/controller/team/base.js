'use strict';

var 
	db = require( __base + 'db'),
	config = require( __base + 'config');


var 
	warp = db.warp,
	next_id = db.next_id, 
	modelDep = db.team_department,
	modelMember = db.team_member,
	DEP_ROOT = 'root',
	DEFAULT_EXPIRES_IN_MS = 1000 * config.session.expires;

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

function* $_member_getUsers(){
	var sql = "select u.id, u.name from users as u where u.actived=1 and u.verified=1";
	return yield warp.$query(sql);
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
		$getUser: $member_getUser
	},

	setHistoryUrl: setHistoryUrl,
	getHistoryUrl: getHistoryUrl

};