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
/project/task

/api/project/t/listExecuting?uid=xx
/api/project/t/listQueue?uid=xx
/api/project/t/:id/listFlow




POST METHOD:
/api/project/t/:id/flow

********/


module.exports = {
	'GET /project/task': function* (){
		yield $_render( this, {}, 'task_index.html');
		base.setHistoryUrl(this);
	},

	'GET /api/project/t/listExecuting': function* (){
		var uid = this.request.query.uid || '';
		this.body = yield base.task.$listExecutingOfUser(uid);
	},

	'GET /api/project/t/listQueue': function* (){
		var uid = this.request.query.uid || '';
		this.body = yield base.task.$listQueueOfUser(uid);
	},

	'GET /api/project/t/:id/listFlow': function* (id){
		this.body = yield base.task.$listFlow(id);
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

		yield base.modelTaskFlow.$create(flow);
		yield base.task.$nextFlow(task, data.action);


		this.body = { result: 'ok'};		
	}
};