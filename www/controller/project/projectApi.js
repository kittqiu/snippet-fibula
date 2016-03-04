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
    context.render( 'project/' + view, yield home.$getModel.apply(context, [model]) );
}

/******
GET METHOD:
/project
/project/group/:id/edit
/project/p/creation
/project/p/:id/build
/project/p/:id/edit
/project/p/:id


/api/project/p/:id/tasklist
/api/project/p/:id

/api/project/group/:id
/api/project/task/:id



POST METHOD:

/api/project/p
/api/project/p/:id
/api/project/p/:id/group
/api/project/p/:id/task
/api/project/group/:id

********/


module.exports = {
	'GET /project': function*(){
		var model = {
			projects: yield base.project.$list( 0, 20 )
		};
		yield $_render( this, model, 'project_index.html');
		base.setHistoryUrl(this);
	},

	'GET /project/group/:id/edit': function* (id){
		var group = yield base.modelGroup.$find(id),
			model = {
				__id: id,
				__project_id: group.project_id,
				__form: {
					src: '/api/project/group/' + id,
					action: '/api/project/group/' + id,
					submit: this.translate('Save')
			},
			roles: base.project.roleOptions(),
			users: yield base.project.$listOptionalUsers(group.project_id||'none')
		};
		yield $_render( this, model, 'p/group_form.html');
	},

	'GET /project/p/creation': function*(){
		var 
			form = {
				name: this.translate('Create project'),
				submit: this.translate('Save'),
				action: '/api/project/p'
			},
			model = {
				__form: form,
				users: yield base.user.$list()
			};
		yield $_render( this, model, 'project_form.html');
	},

	'GET /project/p/:id/build': function* (id){
		var project = yield base.project.$get(id) || {},
			model = {
				__id: id
			};
		yield $_render( this, model, 'p/project_build.html');
	},
	'GET /project/p/:id/edit': function* (id){
		var model = {
				__id: id,
				statusOptions: base.project.statusOptions(),
				roleOptions: base.project.roleOptions(),
				users: yield base.user.$list(),
				__form: {
					src: '/api/project/p/' + id,
					submit: this.translate('Save'),
					action: '/api/project/p/' + id
				}
			};
		yield $_render( this, model, 'p/project_edit.html');
	},

	'GET /project/p/:id': function* (id){
		var model = {
				__id: id,
				statusOptions: base.project.statusOptions(),
				roleOptions: base.project.roleOptions()
			};
		yield $_render( this, model, 'p/project_view.html');
	},

	'GET /api/project/group/:id': function* (id){
		this.body = yield base.group.$get(id);
	},

	'GET /api/project/p/:id/tasklist': function* (id){
		this.body = yield base.project.$listTasks(id);
	},

	'GET /api/project/p/:id': function* (id){
		this.body = yield base.project.$get(id) || {};
	},

	'GET /api/project/task/:id': function* (id){
		this.body = yield base.modelTask.$find(id);
	},

	'POST /api/project/group/:id': function* (id){
		var r = yield base.modelGroup.$find(id), 
			data = this.request.body || {}, 
			members = data.members;
		if( !data.name ){
			throw api.invalidParam('name');
		}
		if( r === null ){
			throw api.notFound('group', this.translate('Record not found'));
		}
		yield db.op.$update_record( r, data, ['name']);

		if( members ){
			for( var i = 0; i < members.length; i++ ){
				var m = members[i];
				if( m.id ){//update
					var mr = yield base.modelMember.$find(m.id);
					if( mr !== null ){
						yield db.op.$update_record( mr, m, ['role', 'responsibility']);
					}
				}else{//add new member
					var user = {
						project_id: r.project_id,
						user_id: m.user_id,
						group_id: r.id,
						responsibility: m.responsibility,
						role: m.role
					};
					yield base.modelMember.$create(user);
				}
			}
		}

		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	},

	'POST /api/project/p': function* (){
		var r,
			data = this.request.body;
		json_schema.validate('project', data);

		r = {
			creator_id: this.request.user.id,
			name: data.name, 
			master_id: data.master_id,
			start_time: data.start_time,
			end_time: data.start_time,
			details: data.details
		};
		yield base.modelProject.$create( r );
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	},
	'POST /api/project/p/:id/group': function* (id){
		var r, 
			data = this.request.body || {},
			name = data.name;
		if( !name ){
			throw api.invalidParam('name');
		}
		
		r = {
			id: db.next_id(),
			project_id: id,
			name: name
		}
		yield base.modelGroup.$create(r);
		this.body = { result: 'ok', data: r };
	},
	'POST /api/project/p/:id/task': function* (id){
		var t, order,
			data = this.request.body || {},
			pid = data.parent || 'root';
		json_schema.validate('simpleTask', data);
		
		order = yield base.task.$maxOrder(pid);
		order++;
		t = {
			id: db.next_id(),
			project_id: id,
			parent: pid,
			name: data.name,
			automode: data.automode==0?true:false,
			number: 0,
			order: order,
			rely_to: data.rely_to,
			duration: data.duration,
			plan_start_time: data.start_time,
			plan_end_time: data.end_time,
			difficulty: data.difficulty,
			closed: 0,
			details: data.details,
			executor_id: data.executor,
			manager_id: '',
			start_time:data.start_time,
			end_time:data.end_time,
			status: 'created'
		};
		yield base.modelTask.$create(t);		
		this.body = { result: 'ok', id: t.id };
	},

	'POST /api/project/p/:id': function* (id){
		var r, cols = [],
			data = this.request.body;
		json_schema.validate('project', data);

		r = yield base.modelProject.$find( id );
		if( r === null ){
			throw api.notFound('project', this.translate('Record not found'));
		}

		yield db.op.$update_record( r, data, ['name', 'start_time', 'end_time', 'details', 'master_id'])
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	}
};