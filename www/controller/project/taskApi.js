'use strict';

var 
	db = require( __base + 'db'),
	api = require( __base + 'api'),
	home = require( __base + 'controller/home'), 
	json_schema = require( __base + 'json_schema'),
	base = require('./base');

var 
	modelUser = db.user;

function* $_render( context, model, view ){
    context.render( 'project/task/' + view, yield home.$getModel.apply(context, [model]) );
}

var ACTIONMAP = {
	accept: '确认接收',
	reply: '回复',
	commit: '提交',
	pause: '暂停执行',
	cancel: '取消任务',
	complete: '完成',
	reopen: '继续执行',
	resume: '恢复执行'
};


/******
GET METHOD:
/project/daily
/project/task

/api/project/daily?date=xx
/api/project/t/listExecuting?uid=xx
/api/project/t/listManage?uid=xx
/api/project/t/listQueue?uid=xx
/api/project/t/:id/listFlow
/api/project/t/:id/daily



POST METHOD:
/api/project/t/:id/flow
/api/project/daily/creation
/api/project/daily/:id

********/


module.exports = {
	'GET /project/daily': function* (){
		yield $_render( this, {}, 'mydaily.html');
		base.setHistoryUrl(this);
	},
	'GET /project/task': function* (){
		yield $_render( this, {}, 'task_index.html');
		base.setHistoryUrl(this);
	},

	'GET /api/project/daily': function* (){
		var uid = this.request.user.id || '',
			date = parseInt(this.request.query.date||'0') || Date.now();
		this.body = yield base.daily.$listUser(uid, date);
	},

	'GET /api/project/t/listExecuting': function* (){
		var uid = this.request.query.uid || '';
		this.body = yield base.task.$listExecutingOfUser(uid);
	},

	'GET /api/project/t/listManage': function* (){
		var uid = this.request.query.uid || this.request.user.id;
		this.body = yield base.task.$listManageOfUser(uid);
	},

	'GET /api/project/t/listQueue': function* (){
		var uid = this.request.query.uid || '';
		this.body = yield base.task.$listQueueOfUser(uid);
	},

	'GET /api/project/t/:id/listFlow': function* (id){
		this.body = yield base.task.$listFlow(id);
	},

	'GET /api/project/t/:id/daily': function* (id){
		this.body = yield base.task.$listDaily(id);
	},

	'POST /api/project/daily/creation': function* (){
		var data = this.request.body,
			task, daily;

		json_schema.validate('workDaily', data);
		task = yield base.modelTask.$find( data.task_id );
		if( task === null ){
			throw api.notFound('task', this.translate('Record not found'));
		}
		daily = {
			id: db.next_id(),
			task_id: data.task_id,
			user_id: this.request.user.id,
			report: data.report,
			duration: data.duration,
			plan: data.plan,
			time: data.time
		}
		task.duration += data.duration;
		yield task.$update(['duration']);
		yield base.modelDaily.$create(daily);

		this.body = { id: daily.id, result: 'ok'};
	},

	'POST /api/project/daily/:id':function* (id){
		var data = this.request.body,
			r = yield base.modelDaily.$find(id),
			task;

		json_schema.validate('workDaily', data);
		if( r === null ){
			throw api.notFound('daily', this.translate('Record not found'));
		}
		task = yield base.modelTask.$find( r.task_id );
		if( task === null ){
			throw api.notFound('task', this.translate('Record not found'));
		}
		task.duration = task.duration - r.duration + data.duration;
		yield task.$update(['duration']);
		yield db.op.$update_record( r, data, ['report', 'plan', 'duration']);
		this.body = { result: 'ok'};
	},

	'POST /api/project/t/:id/flow': function* (id){
		var data = this.request.body,
			task, flow;

		json_schema.validate('taskFlow', data);
		task = yield base.modelTask.$find( id );
		if( task === null ){
			throw api.notFound('task', this.translate('Record not found'));
		}

		flow = {
			task_id: task.id,
			user_name: this.request.user.name,
			action: data.action,
			reply: data.reply
		}

		if( task.status === 'created' && data.action === 'accept'){
			task.start_time = Date.now();
			yield task.$update(['start_time']);
		}else if( data.action === 'cancel' || data.action === 'complete'){
			task.end_time = Date.now();
			yield task.$update(['end_time']);
		}
		yield base.modelTaskFlow.$create(flow);
		yield base.task.$nextFlow(task, data.action);
		this.body = { result: 'ok'};		
	},


};