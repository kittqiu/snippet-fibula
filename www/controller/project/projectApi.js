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
/project/p/creation
/project/p/:id/build
/project/p/:id/edit
/project/p/:id

/api/project/p/:id

POST METHOD:

/api/project/p
/api/project/p/:id

********/


module.exports = {
	'GET /project': function*(){
		var model = {
			projects: yield base.project.$list( 0, 20 )
		};
		console.log(model)
		yield $_render( this, model, 'project_index.html');
		base.setHistoryUrl(this);
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
				project: project
			};
		yield $_render( this, model, 'p/project_build.html');
	},
	'GET /project/p/:id/edit': function* (id){
		var project = yield base.project.$get(id) || {},
			model = {
				__id: id,
				project: project,
				statusOptions: base.project.statusOptions(),
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
		var project = yield base.project.$get(id) || {},
			model = {
				project: project
			};
		yield $_render( this, model, 'p/project_view.html');
	},

	'GET /api/project/p/:id': function* (id){
		this.body = yield base.project.$get(id) || {};
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
	'POST /api/project/p/:id': function* (id){
		var r, cols = [],
			data = this.request.body;
		json_schema.validate('project', data);

		r = yield base.modelProject.$find( id );
		if( r === null ){
			throw api.notFound('project', this.translate('Record not found'));
		}

		/*
		if( data.name !== r.name ){
			r.name = data.name;
			cols.push('name');			
		}
		if( data.start_time !== r.start_time ){
			r.start_time = data.start_time;
			cols.push('start_time');			
		}
		if( data.end_time !== r.end_time ){
			r.end_time = data.end_time;
			cols.push('end_time');			
		}
		if( data.details !== r.details ){
			r.details = data.details;
			cols.push('details');			
		}
		if

		if( cols.length > 0 ){
			yield r.$update(cols);
		}*/
		yield db.$update_record( r, data, ['name', 'start_time', 'end_time', 'details', 'master_id'])
		this.body = {
			result: 'ok',
			redirect: base.getHistoryUrl(this)
		}
	}
};